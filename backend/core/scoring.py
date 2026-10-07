"""Aciklanabilir risk skorlama motoru.

Model
-----
Her sinyal, tek basina gozlendiginde gostergenin zararli olma olasiligini temsil
eden bir agirlik ``p`` (0-1) tasir. Sinyaller "noisy-OR" ile birlesir:

    risk = 1 - prod(1 - p_i) = 1 - exp(-sum(lambda_i)),   lambda_i = -ln(1 - p_i)

Bu sayede:
  * skor hicbir zaman 100'u asmaz ve her yeni sinyal azalan getiriyle eklenir,
  * sinyallerin sirasi sonucu degistirmez,
  * log-uzayinda katkilar toplanabilir oldugu icin her bulgunun skora kac puan
    kattigi tam olarak (lambda payi ile) hesaplanabilir.

Guven artiran sinyaller (eski alan adi, temiz VirusTotal sonucu) carpan olarak
uygulanir ve yalnizca kesin kanit (VirusTotal tespiti, marka taklidi) yoksa
devreye girer. Kesin kanitlar icin alt sinirlar (floor) tanimlidir.
"""

import ipaddress
import math
import re

from backend.core.brands import (
    detect_brand, detect_brand_in_content, detect_fake_suffix, detect_unlisted_gov,
    is_restricted, lure_words, official_brand, registered_domain, sector_label,
)

# ---------------------------------------------------------------------------
# Bilgi tabanlari
# ---------------------------------------------------------------------------

# Kimlik avi sayfalarinin URL'lerinde sik gecen ifadeler (Turkce ve Ingilizce)
BAIT_WORDS = (
    "login", "signin", "sign-in", "logon", "verify", "verification", "secure", "security",
    "update", "account", "banking", "wallet", "password", "auth", "confirm", "unlock",
    "support", "billing", "invoice", "refund",
    "giris", "dogrula", "dogrulama", "guvenlik", "guvenli", "hesap", "sifre", "odeme",
    "iade", "musteri", "basvuru", "aidat", "ceza", "takip",
)

# Kotuye kullanim oranlari yuksek ust seviye alan adlari
RISKY_TLDS = (
    "xyz", "top", "tk", "ml", "ga", "cf", "gq", "zip", "mov", "icu", "cyou", "buzz",
    "rest", "click", "online", "site", "live", "shop", "support", "monster", "sbs", "cfd",
)

SHORTENERS = ("bit.ly", "tinyurl.com", "t.co", "goo.gl", "is.gd", "cutt.ly", "rb.gy", "shorturl.at", "t.ly")

# Seviye esikleri
LEVELS = ((75, "CRITICAL"), (50, "HIGH"), (25, "MEDIUM"), (0, "LOW"))


# ---------------------------------------------------------------------------
# Yardimcilar
# ---------------------------------------------------------------------------

def _is_ip(host):
    try:
        ipaddress.ip_address(host)
        return True
    except ValueError:
        return False


def level_for(score):
    for threshold, name in LEVELS:
        if score >= threshold:
            return name
    return "LOW"


# ---------------------------------------------------------------------------
# Sinyal toplama
# ---------------------------------------------------------------------------

def _signal(key, rule_name, description, severity, p):
    return {"key": key, "rule_name": rule_name, "description": description, "severity": severity, "p": p}


BRAND_KINDS = {
    "label": ("Marka taklidi", "critical", 0.80),
    "glyph": ("Görsel benzer karakterle marka taklidi", "critical", 0.80),
    "typo": ("Yazım benzeri marka taklidi", "critical", 0.70),
    "subdomain": ("Alt alan adında marka kullanımı", "high", 0.60),
    "path": ("Adres yolunda marka adı", "medium", 0.35),
}

# Bu sinyallerden biri varsa guven artiranlar (eski alan adi, temiz VT) uygulanmaz
HARD_EVIDENCE = {"vt", "brand", "content_brand", "exfil", "fake_suffix", "gov_unlisted"}


def _brand_signal(match, age):
    brand = match["brand"]
    gov = bool(brand.get("gov"))
    title, severity, p = BRAND_KINDS[match["kind"]]
    if gov and match["kind"] in ("label", "glyph", "typo"):
        title, p = "Kamu kurumu taklidi", max(p, 0.85)
    official = ", ".join(brand["domains"][:3])
    where = {
        "label": f"Alan adı '{match['token']}' ifadesiyle {brand['name']} kurumunu çağrıştırıyor",
        "glyph": f"Alan adındaki '{match['detail']}' ifadesi rakam ya da benzer harflerle '{match['token']}' yazımını taklit ediyor",
        "typo": f"Alan adındaki '{match['detail']}' ifadesi '{match['token']}' ({brand['name']}) yazımına çok yakın",
        "subdomain": f"'{match['token']}' ({brand['name']}) alt alan adı olarak kullanılmış; kayıtlı alan adı kuruma ait değil",
        "path": f"Adres yolunda '{match['token']}' ({brand['name']}) geçiyor; alan adı kuruma ait değil",
    }[match["kind"]]
    suffix = " veya .gov.tr uzantıları" if gov else ""
    desc = f"{where}. Resmi adres: {official}{suffix}."

    # Koklu alan adlari: marka adi gecse de genellikle mesrudur (bayi, servis, haber sitesi)
    if age is not None and age >= 1095 and match["kind"] in ("label", "glyph", "typo", "path"):
        return _signal("brand_aged", f"{brand['name']} adı geçiyor (köklü alan adı)",
                       f"{where}; ancak alan adı yaklaşık {age // 365} yıldır kayıtlı. Bayi, servis ya da içerik sitesi olabilir.",
                       "medium", 0.20)
    key = "brand" if match["kind"] != "path" else "brand_path"
    return _signal(key, f"{title}: {brand['name']}", desc, severity, p)


def collect_signals(parsed, intel):
    """parsed: url/host/path; intel: harici kaynak ve sayfa yoklamasi sonuclari.
    Doner: (sinyaller, guven artiranlar, baglam)."""
    host = parsed["domain"].lower()
    url_lower = parsed["url"].lower()
    path = parsed.get("rest", "") or parsed.get("path", "")
    age = intel.get("age_days")
    page = intel.get("page") or {}
    signals = []
    mitigations = []
    context = {"target_brand": None, "target_sector": None}

    def set_target(brand):
        if not context["target_brand"]:
            context["target_brand"] = brand["name"]
            context["target_sector"] = sector_label(brand["sector"])

    # --- Resmi adres -----------------------------------------------------------
    ip_host = _is_ip(host)
    own = None if ip_host else official_brand(host)
    if own:
        mitigations.append(_signal("official", f"{own['name']} resmi alan adı",
                                   f"{host} katalogda {own['name']} kurumunun resmi adresi olarak kayıtlı.",
                                   "low", 0.10))
    elif not ip_host and is_restricted(host):
        mitigations.append(_signal("restricted", "Kısıtlı resmi uzantı",
                                   f"{registered_domain(host)} uzantısı yalnızca yetkili kurumlara tahsis edilir.",
                                   "low", 0.20))

    # --- Kurum taklidi (URL) -----------------------------------------------
    if ip_host:
        signals.append(_signal("ip_host", "Alan adı yerine IP adresi",
                               "Bağlantı bir alan adı yerine doğrudan IP adresine gidiyor; meşru hizmetlerde nadirdir.",
                               "high", 0.45))

    fake = None if ip_host else detect_fake_suffix(host)
    if fake:
        signals.append(_signal("fake_suffix", "Sahte resmi uzantı",
                               f"Alan adı '{fake}' ifadesini taşıyor ancak gerçek uzantısı {registered_domain(host)}; "
                               f"resmi kurum adresi izlenimi vermek için kullanılır.",
                               "critical", 0.75))

    match = None if ip_host or own else detect_brand(host, path)
    if match:
        sig = _brand_signal(match, age)
        signals.append(sig)
        if sig["key"] != "brand_aged":
            set_target(match["brand"])
    elif not ip_host and not own:
        entity = detect_unlisted_gov(host, path)
        if entity:
            signals.append(_signal("gov_unlisted", "Kamu kurumu izlenimi",
                                   f"Adres '{entity}' ifadesini kamu hizmeti tuzak kelimeleriyle birlikte kullanıyor; "
                                   f"resmi kurumlar .gov.tr veya .bel.tr uzantılarını kullanır.",
                                   "high", 0.55))
            context["target_brand"] = "Kamu kurumu (katalog dışı)"
            context["target_sector"] = sector_label("government")

    # --- Sayfa icerigi --------------------------------------------------------
    if page.get("status") == "ok":
        final_host = page.get("final_host") or host
        final_reg = registered_domain(final_host)
        if final_reg != registered_domain(host):
            signals.append(_signal("redirect", "Başka alan adına yönlendirme",
                                   f"Adres ziyaret edildiğinde {final_host} alan adına yönlendiriyor.",
                                   "low", 0.08))
            if not match:
                final_match = detect_brand(final_host, "")
                if final_match:
                    sig = _brand_signal(final_match, None)
                    sig["description"] = f"Yönlendirilen alan adında: {sig['description']}"
                    signals.append(sig)
                    set_target(final_match["brand"])

        content = detect_brand_in_content(page)
        sensitive = [f for f in page.get("fields", []) if f != "Telefon"]
        if content:
            b = content["brand"]
            zone = {"identity": "başlık veya site adı", "logo": "logo görselleri", "body": "sayfa metni"}[content["zone"]]
            signals.append(_signal("content_brand", f"Sayfa {b['name']} kimliği taşıyor",
                                   f"Sayfanın {zone} alanında '{content['term']}' geçiyor ancak sayfa {final_host} "
                                   f"üzerinde; kurumun resmi adresi {', '.join(b['domains'][:2])}.",
                                   "critical" if content["zone"] != "body" else "high",
                                   {"identity": 0.70, "logo": 0.60, "body": 0.45}[content["zone"]]))
            set_target(b)

        if sensitive and not own:
            impersonating = bool(content or context["target_brand"])
            card_or_id = page.get("card_input") or page.get("tckn_input")
            if impersonating or card_or_id:
                p = 0.45 if impersonating else 0.30
                signals.append(_signal("harvest", "Hassas bilgi toplayan form",
                                       f"Sayfa şu bilgileri istiyor: {', '.join(sensitive)}.",
                                       "high", p))

        if page.get("exfil"):
            signals.append(_signal("exfil", "Veri sızdırma kodu",
                                   f"Sayfa kaynağında {page['exfil']} adresi var; oltalama kitleri girilen bilgileri "
                                   f"bu yolla saldırgana iletir.",
                                   "critical", 0.85))

        if sensitive and page.get("external_form_hosts"):
            signals.append(_signal("form_external", "Form başka alan adına gönderiliyor",
                                   f"Hassas alanlar içeren form verileri {', '.join(page['external_form_hosts'][:3])} "
                                   f"adresine gönderiliyor.",
                                   "medium", 0.25))

    reg = registered_domain(host)
    if host.startswith("xn--") or ".xn--" in host:
        signals.append(_signal("punycode", "Punycode (IDN) alan adı",
                               "Alan adı Punycode kodlu; görsel olarak başka bir alan adını taklit ediyor olabilir.",
                               "high", 0.35))

    if "@" in parsed.get("authority", ""):
        signals.append(_signal("userinfo", "URL içinde '@' yönlendirmesi",
                               "Adresin '@' öncesi kısmı tarayıcıda yok sayılır; kullanıcıyı yanıltmak için kullanılır.",
                               "high", 0.45))

    depth = host.count(".") - reg.count(".")
    if depth >= 3:
        signals.append(_signal("deep_sub", "Aşırı alt alan adı derinliği",
                               f"Alan adında {depth} seviye alt alan adı var; gerçek alan adını gizlemek için kullanılır.",
                               "medium", 0.20))

    hyphens = reg.split(".")[0].count("-")
    if hyphens >= 2:
        signals.append(_signal("hyphens", "Çok sayıda tire",
                               f"Kayıtlı alan adında {hyphens} tire var; oltalama alan adlarında yaygın bir kalıptır.",
                               "medium", 0.15))

    tld = host.rsplit(".", 1)[-1] if "." in host else ""
    if tld in RISKY_TLDS:
        signals.append(_signal("tld", "Riskli üst seviye alan adı",
                               f"'.{tld}' uzantısı kötüye kullanım oranı yüksek uzantılar arasında.",
                               "medium", 0.25))

    if reg in SHORTENERS:
        signals.append(_signal("shortener", "URL kısaltıcı",
                               "Kısaltılmış bağlantı gerçek hedefi gizliyor; hedef ayrıca analiz edilmeli.",
                               "medium", 0.20))

    # --- Icerik ifadeleri ----------------------------------------------------
    found = []
    for word in BAIT_WORDS:
        if re.search(rf"(?<![a-z]){re.escape(word)}", url_lower) and word not in found:
            found.append(word)
    for word in lure_words(host, path):
        if word not in found and len(word) >= 4:
            found.append(word)
    if found:
        # Her ek kelime azalan getiriyle: 1 kelime 0.20, 2 kelime ~0.34, 3+ ~0.45
        p = 1 - (1 - 0.20) * (1 - 0.18) ** min(len(found) - 1, 2)
        signals.append(_signal("bait", "Kimlik avı ifadeleri",
                               f"Adreste kimlik avıyla ilişkilendirilen ifadeler geçiyor: {', '.join(found[:6])}.",
                               "high" if len(found) >= 2 else "medium", round(p, 3)))

    # --- Baglanti guvenligi --------------------------------------------------
    tls = intel.get("tls")
    if tls == "none":
        signals.append(_signal("no_https", "Şifresiz bağlantı (HTTP)",
                               "Sunucu HTTPS sunmuyor; girilen bilgiler şifresiz iletilir.",
                               "medium", 0.15))
    elif tls == "http_link":
        signals.append(_signal("no_https", "Şifresiz bağlantı (HTTP)",
                               "Bağlantı açıkça http:// ile veriliyor; girilen bilgiler şifresiz iletilir.",
                               "medium", 0.15))
    elif tls == "invalid":
        signals.append(_signal("bad_tls", "Geçersiz TLS sertifikası",
                               "Sunucu HTTPS sunuyor ancak sertifika doğrulanamadı (süresi dolmuş, kendinden imzalı veya alan adıyla uyuşmuyor).",
                               "high", 0.30))

    # --- Kayit yasi ------------------------------------------------------------
    age = intel.get("age_days")
    if age is not None:
        if age < 7:
            signals.append(_signal("age", "Çok yeni alan adı",
                                   f"Alan adı {age} gün önce kaydedilmiş. Oltalama altyapısı genellikle kullanımdan hemen önce kurulur.",
                                   "critical", 0.55))
        elif age < 30:
            signals.append(_signal("age", "Yeni alan adı",
                                   f"Alan adı {age} gün önce kaydedilmiş.",
                                   "high", 0.40))
        elif age < 180:
            signals.append(_signal("age", "Genç alan adı",
                                   f"Alan adı {age} gün önce kaydedilmiş.",
                                   "medium", 0.15))
        elif age >= 3650:
            mitigations.append(_signal("age_old", "Köklü alan adı",
                                       f"Alan adı yaklaşık {age // 365} yıldır kayıtlı.", "low", 0.55))
        elif age >= 1095:
            mitigations.append(_signal("age_old", "Eski alan adı",
                                       f"Alan adı yaklaşık {age // 365} yıldır kayıtlı.", "low", 0.75))

    # --- Itibar ----------------------------------------------------------------
    vt_pos, vt_total = intel.get("vt_positives"), intel.get("vt_total")
    if vt_pos is not None:
        if vt_pos >= 5:
            signals.append(_signal("vt", "VirusTotal tespiti",
                                   f"{vt_total} motordan {vt_pos} tanesi adresi zararlı veya şüpheli olarak işaretledi.",
                                   "critical", 0.95))
        elif vt_pos >= 2:
            signals.append(_signal("vt", "VirusTotal tespiti",
                                   f"{vt_total} motordan {vt_pos} tanesi adresi zararlı veya şüpheli olarak işaretledi.",
                                   "high", 0.75))
        elif vt_pos == 1:
            signals.append(_signal("vt", "Tekil VirusTotal tespiti",
                                   f"{vt_total} motordan 1 tanesi adresi işaretledi; tekil tespitler yanlış pozitif olabilir.",
                                   "medium", 0.30))
        elif vt_total and vt_total >= 50:
            mitigations.append(_signal("vt_clean", "VirusTotal temiz",
                                       f"{vt_total} motorun hiçbiri adresi işaretlemedi.", "low", 0.85))

    abuse = intel.get("abuse_score")
    if abuse is not None:
        if abuse >= 75:
            signals.append(_signal("abuse", "Kötü IP itibarı",
                                   f"Barındırma IP adresinin AbuseIPDB güven skoru %{abuse}.", "high", 0.45))
        elif abuse >= 25:
            signals.append(_signal("abuse", "Şüpheli IP itibarı",
                                   f"Barındırma IP adresinin AbuseIPDB güven skoru %{abuse}.", "medium", 0.20))

    if intel.get("resolved") is False and not _is_ip(host):
        signals.append(_signal("nxdomain", "Alan adı çözümlenmiyor",
                               "Alan adı şu anda bir IP adresine çözümlenmiyor; kapatılmış veya henüz yayına alınmamış olabilir.",
                               "low", 0.05))

    return signals, mitigations, context


# ---------------------------------------------------------------------------
# Birlestirme ve katki dagitimi
# ---------------------------------------------------------------------------

def _apportion(total, weights):
    """Toplami agirliklara gore tam sayilara boler (en buyuk kalan yontemi)."""
    s = sum(weights)
    if total <= 0 or s <= 0:
        return [0] * len(weights)
    raw = [total * w / s for w in weights]
    out = [math.floor(r) for r in raw]
    remainder = total - sum(out)
    order = sorted(range(len(raw)), key=lambda i: raw[i] - out[i], reverse=True)
    for i in order[:remainder]:
        out[i] += 1
    return out


def score_signals(signals, mitigations):
    lambdas = [-math.log(1 - min(s["p"], 0.99)) for s in signals]
    raw = 100 * (1 - math.exp(-sum(lambdas)))

    keys = {s["key"] for s in signals}
    hard_evidence = bool(keys & HARD_EVIDENCE)

    # Guven artiranlar yalnizca kesin kanit yokken uygulanir
    applied = [] if hard_evidence else mitigations
    factor = 1.0
    for m in applied:
        factor *= m["p"]
    adjusted = raw * factor

    # Kesin kanit icin alt sinirlar
    floor = 0
    vt = next((s for s in signals if s["key"] == "vt"), None)
    if vt and vt["p"] >= 0.95:
        floor = max(floor, 85)
    young = any(s["key"] == "age" and s["p"] >= 0.40 for s in signals)
    impersonation = keys & {"brand", "content_brand", "fake_suffix", "gov_unlisted"}
    if impersonation and young:
        floor = max(floor, 80)
    if "content_brand" in keys and "harvest" in keys:
        floor = max(floor, 85)
    if "brand" in keys and "harvest" in keys:
        floor = max(floor, 85)
    if "exfil" in keys:
        floor = max(floor, 85)

    score = max(0, min(int(round(max(adjusted, floor))), 100))

    # Katki: sinyaller lambda payiyla bolusur; guven artiranlar eksi katki olarak gosterilir.
    # Alt sinir uygulandiysa fark kesin kanit sinyallerine dagitilmis olur.
    positive_total = max(int(round(max(raw, floor))), score)
    contributions = _apportion(positive_total, lambdas)
    reduction = positive_total - score
    neg_weights = [-math.log(m["p"]) for m in applied]
    reductions = _apportion(reduction, neg_weights)

    reasons = []
    for s, c in zip(signals, contributions):
        reasons.append({"rule_name": s["rule_name"], "description": s["description"],
                        "severity": s["severity"], "contribution": c})
    for m, r in zip(applied, reductions):
        reasons.append({"rule_name": m["rule_name"], "description": m["description"],
                        "severity": "low", "contribution": -r})

    reasons.sort(key=lambda r: -abs(r["contribution"]))
    return score, level_for(score), reasons
