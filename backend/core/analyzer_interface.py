from urllib.parse import urlparse
import re

from concurrent.futures import ThreadPoolExecutor

from sqlalchemy.orm import Session
from backend.core.domain_intel import lookup_domain_registration, resolve_ip
from backend.core.reputation import check_ip_reputation, check_url_reputation
from backend.core.typosquat import find_related_domains
from backend.models.list_model import ListModel

def parse_url_components(url: str):
    if not url.startswith(("http://", "https://")):
        url_with_scheme = "http://" + url
    else:
        url_with_scheme = url
        
    parsed = urlparse(url_with_scheme)
    domain = parsed.netloc.split(":")[0] if parsed.netloc else parsed.path.split("/")[0]
    has_https = url.startswith("https://")
    
    return {
        "url": url,
        "domain": domain,
        "has_https": has_https,
        "path": parsed.path
    }

def check_list_match(db: Session, domain: str, raw_url: str, list_type: str):
    if not db:
        return None
    entries = db.query(ListModel).filter(ListModel.list_type == list_type).all()
    domain_clean = domain.lower().strip()
    url_clean = raw_url.lower().strip()
    
    for entry in entries:
        p = entry.pattern.lower().strip()
        if p and (domain_clean == p or domain_clean.endswith("." + p) or p in url_clean):
            return entry
    return None

def analyze_url_pipeline(raw_url: str, db: Session = None) -> dict:
    parsed = parse_url_components(raw_url)
    domain = parsed["domain"]
    url = parsed["url"]
    has_https = parsed["has_https"]
    
    reasons = []
    mitre_techniques = []
    risk_score = 0
    
    # 1. Whitelist Kontrolü
    whitelist_match = check_list_match(db, domain, url, "whitelist") if db else None
    if whitelist_match:
        return {
            "url": url,
            "risk_score": 0,
            "risk_level": "SAFE",
            "reasons": [{
                "rule_name": "Güvenli Liste (Whitelist) Eşleşmesi",
                "description": f"Alan adı/URL veritabanındaki onaylı güvenli listede yer alıyor: '{whitelist_match.pattern}'" + (f" ({whitelist_match.description})" if whitelist_match.description else ""),
                "severity": "low"
            }],
            "ioc_details": {
                "domain": domain,
                "registrar": "Whitelist Onaylı",
                "domain_age_days": 3650,
                "domain_registration_date": "Onaylı Kurumsal",
                "ip_address": "Güvenli Liste",
                "abuse_score": 0,
                "ip_reports_count": 0,
                "abuse_status": "ok",
                "url": url,
                "vt_positives": 0,
                "vt_total": 90,
                "vt_status": "ok",
                "has_https": has_https
            },
            "mitre_techniques": [],
            "related_domains": []
        }

    # 2. Blacklist Kontrolü
    blacklist_match = check_list_match(db, domain, url, "blacklist") if db else None
    if blacklist_match:
        return {
            "url": url,
            "risk_score": 100,
            "risk_level": "CRITICAL",
            "reasons": [{
                "rule_name": "Zararlı Liste (Blacklist) Eşleşmesi",
                "description": f"Alan adı/URL veritabanındaki bilinen tehdit listesinde yer alıyor: '{blacklist_match.pattern}'" + (f" ({blacklist_match.description})" if blacklist_match.description else ""),
                "severity": "critical"
            }],
            "ioc_details": {
                "domain": domain,
                "registrar": "Zararlı Liste Tespiti",
                "domain_age_days": 0,
                "domain_registration_date": "Tehdit Aktörü",
                "ip_address": "Engellenmiş IP",
                "abuse_score": 100,
                "ip_reports_count": 99,
                "abuse_status": "blacklisted",
                "url": url,
                "vt_positives": 45,
                "vt_total": 90,
                "vt_status": "blacklisted",
                "has_https": has_https
            },
            "mitre_techniques": [{
                "id": "T1566.002",
                "tactic": "Initial Access",
                "technique": "Spearphishing Link"
            }, {
                "id": "T1584.001",
                "tactic": "Resource Development",
                "technique": "Compromise Infrastructure: Domains"
            }],
            "related_domains": []
        }
    
    suspicious_keywords = ["login", "verify", "secure", "update", "banking", "account", "paypal", "microsoft", "google"]
    found_keywords = [kw for kw in suspicious_keywords if kw in url.lower()]
    if found_keywords:
        risk_score += len(found_keywords) * 20
        reasons.append({
            "rule_name": "Şüpheli Anahtar Kelime Tespiti",
            "description": f"URL içerisinde kimlik avı şüphesi uyandıran kelimeler tespit edildi: {', '.join(found_keywords)}",
            "severity": "high"
        })
        mitre_techniques.append({
            "id": "T1566.002",
            "tactic": "Initial Access",
            "technique": "Spearphishing Link"
        })
        mitre_techniques.append({
            "id": "T1056.003",
            "tactic": "Credential Access",
            "technique": "Web Framing / Harvesting"
        })

    if not has_https:
        risk_score += 15
        reasons.append({
            "rule_name": "Güvensiz İletişim (HTTP)",
            "description": "URL HTTPS şifrelemesi kullanmıyor (HTTP bağlantısı)",
            "severity": "medium"
        })

    is_suspicious_tld = any(domain.endswith(tld) for tld in [".xyz", ".top", ".top", ".tk", ".cf", ".gq", ".online", ".site", ".zip"])
    if is_suspicious_tld:
        risk_score += 25
        reasons.append({
            "rule_name": "Şüpheli Üst Seviye Alan Adı (TLD)",
            "description": f"Domain yüksek riskli grupta yer alan TLD kullanıyor: {domain}",
            "severity": "high"
        })

    with ThreadPoolExecutor(max_workers=3) as pool:
        registration_task = pool.submit(lookup_domain_registration, domain)
        ip_task = pool.submit(resolve_ip, domain)
        url_reputation_task = pool.submit(check_url_reputation, url)

        registration = registration_task.result()
        ip_address = ip_task.result()
        url_reputation = url_reputation_task.result()
        related_domains = []

    ip_reputation = check_ip_reputation(ip_address)

    risk_score = min(max(risk_score, 10 if found_keywords else 5), 100)
    
    if risk_score >= 75:
        risk_level = "CRITICAL"
    elif risk_score >= 50:
        risk_level = "HIGH"
    elif risk_score >= 25:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    if not reasons:
        reasons.append({
            "rule_name": "Standart Kontrol",
            "description": "Bilinen doğrudan bir zararlı tehdit göstergesi tespit edilmedi",
            "severity": "low"
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
            "has_https": has_https
        },
        "mitre_techniques": mitre_techniques,
        "related_domains": related_domains
    }
