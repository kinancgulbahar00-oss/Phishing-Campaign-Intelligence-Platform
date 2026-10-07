import ipaddress
import re
from urllib.parse import urlparse

from concurrent.futures import ThreadPoolExecutor

from sqlalchemy.orm import Session
from backend.core.domain_intel import lookup_domain_registration, resolve_ip, probe_tls
from backend.core.reputation import check_ip_reputation, check_url_reputation
from backend.core.scoring import collect_signals, score_signals
from backend.core.page_probe import probe_page
from backend.models.list_model import ListModel


def parse_url_components(raw: str):
    """Ham girdiyi ayristirir. Sema yazilmamissa 'scheme' None doner;
    hangi semanin kullanilacagi TLS yoklamasindan sonra belirlenir."""
    text = raw.strip()
    lowered = text.lower()
    if lowered.startswith("https://"):
        scheme = "https"
    elif lowered.startswith("http://"):
        scheme = "http"
    else:
        scheme = None

    parsed = urlparse(text if scheme else "//" + text)
    authority = parsed.netloc
    host = authority.rsplit("@", 1)[-1].split(":")[0].strip("[]").lower()
    rest = text.split(authority, 1)[1] if authority and authority in text else ""

    return {
        "raw": text,
        "scheme": scheme,
        "domain": host,
        "authority": authority,
        "rest": rest,
        "path": parsed.path,
    }


def normalized_url(parsed, scheme):
    return f"{scheme}://{parsed['authority']}{parsed['rest']}"


def extract_host(value: str) -> str:
    """google.com, www.google.com, https://www.google.com/x?y -> google.com"""
    v = (value or "").strip().lower()
    if "://" not in v:
        v = "http://" + v
    host = (urlparse(v).hostname or "").rstrip(".")
    try:
        host = host.encode("idna").decode("ascii")
    except UnicodeError:
        pass
    if host.startswith("www."):
        host = host[4:]
    return host


def host_matches(host: str, pattern_host: str) -> bool:
    if not host or not pattern_host:
        return False
    # IP ise sadece birebir eslesme
    try:
        ipaddress.ip_address(host)
        return host == pattern_host
    except ValueError:
        pass
    return host == pattern_host or host.endswith("." + pattern_host)


def _strip_scheme(url: str) -> str:
    v = (url or "").strip().lower()
    v = re.sub(r"^https?://", "", v)
    return v[4:] if v.startswith("www.") else v


def check_list_match(db: Session, domain: str, raw_url: str, list_type: str):
    """Kurallar host uzerinden eslesir; 'evil.com/google.com' gibi adresler
    'google.com' kuralina takilmaz. Tam URL kurallari adresin basiyla karsilastirilir."""
    if not db:
        return None
    host = extract_host(domain) or extract_host(raw_url)
    url = _strip_scheme(raw_url)
    entries = db.query(ListModel).filter(ListModel.list_type == list_type).all()
    for entry in entries:
        if entry.entry_type == "url":
            pattern = _strip_scheme(entry.pattern)
            if pattern and (url == pattern or url.startswith(pattern.rstrip("/") + "/")):
                return entry
        elif host_matches(host, extract_host(entry.pattern)):
            return entry
    return None


def _empty_ioc(domain, url, has_https, status):
    """Liste eslesmesinde harici kaynaklar sorgulanmaz; degerler uydurulmaz."""
    return {
        "domain": domain,
        "registrar": None,
        "domain_age_days": None,
        "domain_registration_date": None,
        "ip_address": None,
        "abuse_score": None,
        "ip_reports_count": None,
        "abuse_status": status,
        "url": url,
        "vt_positives": None,
        "vt_total": None,
        "vt_status": status,
        "has_https": has_https,
        "tls_status": None,
    }


def analyze_url_pipeline(raw_url: str, db: Session = None) -> dict:
    parsed = parse_url_components(raw_url)
    domain = parsed["domain"]

    # Liste kontrolleri sema bilinmeden de yapilabilir
    list_url = parsed["raw"]

    whitelist_match = check_list_match(db, domain, list_url, "whitelist") if db else None
    if whitelist_match:
        url = normalized_url(parsed, parsed["scheme"] or "https")
        note = f" ({whitelist_match.description})" if whitelist_match.description else ""
        return {
            "url": url,
            "risk_score": 0,
            "risk_level": "SAFE",
            "reasons": [{
                "rule_name": "İzin listesi eşleşmesi",
                "description": f"Gösterge analist izin listesindeki '{whitelist_match.pattern}' kuralıyla eşleşti{note}.",
                "severity": "low",
                "contribution": 0,
            }],
            "ioc_details": _empty_ioc(domain, url, parsed["scheme"] != "http", "whitelisted"),
            "mitre_techniques": [],
            "related_domains": [],
        }

    blacklist_match = check_list_match(db, domain, list_url, "blacklist") if db else None
    if blacklist_match:
        url = normalized_url(parsed, parsed["scheme"] or "https")
        note = f" ({blacklist_match.description})" if blacklist_match.description else ""
        return {
            "url": url,
            "risk_score": 100,
            "risk_level": "CRITICAL",
            "reasons": [{
                "rule_name": "Engel listesi eşleşmesi",
                "description": f"Gösterge analist engel listesindeki '{blacklist_match.pattern}' kuralıyla eşleşti{note}.",
                "severity": "critical",
                "contribution": 100,
            }],
            "ioc_details": _empty_ioc(domain, url, parsed["scheme"] != "http", "blacklisted"),
            "mitre_techniques": [],
            "related_domains": [],
        }

    # Harici sorgular paralel: kayit bilgisi, DNS ve TLS yoklamasi
    with ThreadPoolExecutor(max_workers=3) as pool:
        registration_task = pool.submit(lookup_domain_registration, domain)
        ip_task = pool.submit(resolve_ip, domain)
        tls_task = pool.submit(probe_tls, domain)
        registration = registration_task.result()
        ip_address = ip_task.result()
        tls = tls_task.result()

    # Alan adi cozumlenmiyorsa sunucu hakkinda HTTPS hukmu verilemez
    if ip_address is None:
        tls = "unreachable"

    # Sema yazilmamissa sunucunun gercekte ne sundugu esas alinir
    if tls == "unreachable":
        scheme = parsed["scheme"] or "https"
        tls_signal = "http_link" if parsed["scheme"] == "http" else None
    elif parsed["scheme"] == "http":
        scheme, tls_signal = "http", "http_link"
    elif parsed["scheme"] == "https":
        scheme, tls_signal = "https", tls if tls != "valid" else None
    else:
        scheme = "https" if tls in ("valid", "invalid") else "http"
        tls_signal = None if tls == "valid" else tls
    has_https = scheme == "https" and tls in ("valid", "invalid")
    url = normalized_url(parsed, scheme)

    with ThreadPoolExecutor(max_workers=3) as pool:
        url_task = pool.submit(check_url_reputation, url)
        ip_rep_task = pool.submit(check_ip_reputation, ip_address)
        page_task = pool.submit(probe_page, url) if ip_address else None
        url_reputation = url_task.result()
        ip_reputation = ip_rep_task.result()
        page = page_task.result() if page_task else {"status": "unreachable"}

    intel = {
        "tls": tls_signal,
        "age_days": registration["age_days"],
        "vt_positives": url_reputation["vt_positives"],
        "vt_total": url_reputation["vt_total"],
        "abuse_score": ip_reputation["abuse_score"],
        "resolved": ip_address is not None,
        "page": page,
    }
    signals, mitigations, context = collect_signals({**parsed, "url": url}, intel)
    risk_score, risk_level, reasons = score_signals(signals, mitigations)

    if not reasons:
        reasons.append({
            "rule_name": "Bilinen gösterge yok",
            "description": "Kontrol edilen kuralların hiçbiri tetiklenmedi. Bu, adresin güvenli olduğu anlamına gelmez.",
            "severity": "low",
            "contribution": 0,
        })

    return {
        "url": url,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "reasons": reasons,
        "ioc_details": {
            "domain": domain,
            "registrar": registration["registrar"],
            "domain_age_days": registration["age_days"],
            "domain_registration_date": registration["registration_date"],
            "ip_address": ip_address,
            "abuse_score": ip_reputation["abuse_score"],
            "ip_reports_count": ip_reputation["reports_count"],
            "abuse_status": ip_reputation["status"],
            "url": url,
            "vt_positives": url_reputation["vt_positives"],
            "vt_total": url_reputation["vt_total"],
            "vt_status": url_reputation["status"],
            "has_https": has_https,
            "tls_status": tls,
            "target_brand": context["target_brand"],
            "target_sector": context["target_sector"],
            "page_status": page.get("status"),
            "page_title": page.get("title"),
            "final_url": page.get("final_url") if page.get("final_url") != url else None,
            "page_fields": page.get("fields") or [],
        },
        "mitre_techniques": [],
        "related_domains": [],
    }
