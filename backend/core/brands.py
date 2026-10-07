"""Turkiye pazari marka ve kurum taklidi tespiti.

Katalog: backend/data/tr_brands.json. Tespit sirasi en guclu kanittan zayifa:

  1. Sahte resmi uzanti      : turkiye-gov-tr.com, edevlet.gov.tr.giris.xyz
  2. Kayitli alan adinda marka: garantibbva-bonus.com, kucoins-signin.com
  3. Yazim benzeri taklit    : garamtibbva.com, akbnak.com, g4ranti...
  4. Alt alan adinda marka   : ziraat.hesap-dogrula.xyz
  5. Yolda marka             : site.com/garanti/giris
  6. Katalog disi kamu taklidi: "belediye", "valilik", "bakanligi" + kamu tuzagi,
                                .gov.tr / .bel.tr disinda

Normalizasyon: IDN (punycode) cozumu, Kiril/Yunan sahte harfler, Turkce karakterler
ve rakam homoglifleri ASCII'ye indirgenir.
"""

import json
import re
import unicodedata
from functools import lru_cache
from pathlib import Path

CATALOG_PATH = Path(__file__).resolve().parent.parent / "data" / "tr_brands.json"

SECOND_LEVEL_SUFFIXES = {
    "com.tr", "net.tr", "org.tr", "gov.tr", "edu.tr", "bel.tr", "k12.tr", "gen.tr", "biz.tr", "web.tr",
    "info.tr", "tv.tr", "av.tr", "dr.tr", "pol.tr", "tsk.tr", "mil.tr", "kep.tr", "name.tr", "tel.tr",
    "co.uk", "org.uk", "ac.uk", "com.au", "co.jp", "com.br", "co.in", "com.de",
}

# Kiril ve Yunan harflerinden Latin karsiliklarina (gorsel taklit)
CONFUSABLES = str.maketrans({
    "а": "a", "е": "e", "о": "o", "р": "p", "с": "c", "у": "y", "х": "x", "к": "k", "м": "m",
    "т": "t", "н": "h", "в": "b", "і": "i", "ј": "j", "ѕ": "s", "ԁ": "d", "ɡ": "g", "ⅼ": "l",
    "α": "a", "ο": "o", "ρ": "p", "ε": "e", "ι": "i", "κ": "k", "ν": "v", "τ": "t", "υ": "u",
})
TURKISH = str.maketrans({"ı": "i", "İ": "i", "ş": "s", "Ş": "s", "ğ": "g", "Ğ": "g",
                         "ü": "u", "Ü": "u", "ö": "o", "Ö": "o", "ç": "c", "Ç": "c", "â": "a", "î": "i", "û": "u"})
DIGIT_GLYPHS = (("rn", "m"), ("vv", "w"), ("0", "o"), ("1", "l"), ("3", "e"), ("4", "a"), ("5", "s"), ("7", "t"), ("8", "b"))

# Katalog disindaki kamu kurumlarini yakalamak icin kurum turu kelimeleri
GOV_ENTITY_WORDS = ("belediye", "buyuksehir", "valilik", "valiligi", "kaymakamlik", "bakanlik", "bakanligi",
                    "mudurlugu", "baskanligi", "cumhurbaskanligi", "tccb", "devlet", "resmi", "hukumet", "tbmm",
                    "universitesi", "universite")
FAKE_SUFFIX_RE = re.compile(r"(?:^|[.-])(gov|edu|bel|pol|tsk|k12)[.-]?tr(?:[.-]|$)")


# ---------------------------------------------------------------------------
# Katalog
# ---------------------------------------------------------------------------

@lru_cache(maxsize=1)
def catalog():
    data = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    brands = []
    for b in data["brands"]:
        brands.append({
            **b,
            "aliases": [normalize_text(a).replace(" ", "") for a in b.get("aliases", [])],
            "weak_aliases": [normalize_text(a).replace(" ", "") for a in b.get("weak_aliases", [])],
            "terms": [normalize_text(t) for t in b.get("terms", []) if t],
            "domains": [d.lower() for d in b.get("domains", [])],
            "lures": set(data["sectors"][b["sector"]]["lures"]),
        })
    return {
        "brands": brands,
        "sectors": data["sectors"],
        "restricted": tuple(data["restricted_suffixes"]),
        "all_lures": {w for s in data["sectors"].values() for w in s["lures"]},
    }


def sector_label(sector):
    return catalog()["sectors"].get(sector, {}).get("label", sector)


def catalog_summary():
    cat = catalog()
    return [
        {"id": b["id"], "name": b["name"], "sector": b["sector"], "sector_label": sector_label(b["sector"]),
         "domains": b["domains"]}
        for b in cat["brands"]
    ]


# ---------------------------------------------------------------------------
# Normalizasyon
# ---------------------------------------------------------------------------

def decode_idn(host):
    labels = []
    for label in host.split("."):
        if label.startswith("xn--"):
            try:
                labels.append(label.encode("ascii").decode("idna"))
                continue
            except UnicodeError:
                pass
        labels.append(label)
    return ".".join(labels)


def normalize_text(text):
    """Kucuk harf, Turkce ve gorsel taklit harfleri ASCII'ye, aksanlari sil."""
    text = (text or "").replace("İ", "i").replace("I", "ı").lower()
    text = text.translate(TURKISH).translate(CONFUSABLES)
    text = unicodedata.normalize("NFKD", text)
    return "".join(ch for ch in text if not unicodedata.combining(ch))


def deglyph(text):
    out = text
    for fake, real in DIGIT_GLYPHS:
        out = out.replace(fake, real)
    return out


def registered_domain(host):
    parts = host.lower().strip(".").split(".")
    if len(parts) < 2:
        return host.lower()
    if ".".join(parts[-2:]) in SECOND_LEVEL_SUFFIXES and len(parts) >= 3:
        return ".".join(parts[-3:])
    return ".".join(parts[-2:])


def _suffix_of(reg):
    return reg.split(".", 1)[1] if "." in reg else ""


def is_restricted(host, restricted=None):
    restricted = restricted or catalog()["restricted"]
    host = host.lower()
    return any(host == s or host.endswith("." + s) for s in restricted)


def is_official(host, brand):
    host = host.lower()
    if any(host == d or host.endswith("." + d) for d in brand["domains"]):
        return True
    return bool(brand.get("gov")) and is_restricted(host)


def damerau(a, b, limit=2):
    if abs(len(a) - len(b)) > limit:
        return limit + 1
    d = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    for i in range(len(a) + 1):
        d[i][0] = i
    for j in range(len(b) + 1):
        d[0][j] = j
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            cost = 0 if a[i - 1] == b[j - 1] else 1
            d[i][j] = min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
            if i > 1 and j > 1 and a[i - 1] == b[j - 2] and a[i - 2] == b[j - 1]:
                d[i][j] = min(d[i][j], d[i - 2][j - 2] + 1)
    return d[len(a)][len(b)]


# ---------------------------------------------------------------------------
# URL ayristirma
# ---------------------------------------------------------------------------

def url_parts(host, path=""):
    """Tespit icin normallestirilmis parcalar."""
    uhost = normalize_text(decode_idn(host.lower()))
    reg = registered_domain(uhost)
    label = reg.split(".")[0]
    sub = uhost[: -len(reg)].rstrip(".") if uhost.endswith(reg) and uhost != reg else ""
    npath = normalize_text(path or "")
    return {
        "host": uhost,
        "reg": reg,
        "label": label,
        "plain": label.replace("-", ""),
        "label_tokens": [t for t in re.split(r"[-_]", label) if t],
        "sub_tokens": [t for t in re.split(r"[-_.]", sub) if t],
        "path_tokens": [t for t in re.split(r"[^a-z0-9]+", npath) if t],
        "words": set(re.split(r"[^a-z0-9]+", uhost + " " + npath)) - {""},
        "blob": re.sub(r"[^a-z0-9]", "", uhost + npath),
    }


def _has_lure(parts, lures):
    if parts["words"] & lures:
        return True
    # Turkce eklemeli yapi: "subesi", "faturaniz", "cezasi" kok uzerinden eslesir
    if any(w.startswith(l) for w in parts["words"] for l in lures if len(l) >= 4):
        return True
    return any(lure in parts["blob"] for lure in lures if len(lure) >= 5)


def _short_hit(alias, token, lures):
    """Kisa ifadeler (<=4) yalnizca tam parca ya da 'ptt' + 'kargo' gibi tuzak kelimeyle birlesik."""
    if token == alias:
        return True
    if token.startswith(alias) and (token[len(alias):] in lures or token[len(alias):].isdigit()):
        return True
    if token.endswith(alias) and token[: -len(alias)] in lures:
        return True
    return False


def _long_hit(alias, token):
    return token.startswith(alias) or (len(alias) >= 6 and alias in token)


# ---------------------------------------------------------------------------
# Tespit
# ---------------------------------------------------------------------------

def _match(brand, kind, token, detail):
    return {"brand": brand, "kind": kind, "token": token, "detail": detail}


def official_brand(host):
    """Alan adi katalogdaki bir kurumun resmi adresiyse o kurumu dondurur.
    Birden fazla kurum ayni adresi listeliyorsa adresi birincil olarak tasiyan secilir."""
    uhost = normalize_text(decode_idn(host.lower()))
    owners = []
    for brand in catalog()["brands"]:
        for rank, d in enumerate(brand["domains"]):
            if uhost == d or uhost.endswith("." + d):
                owners.append((rank, brand))
                break
    return min(owners, key=lambda o: o[0])[1] if owners else None


def _windows(parts):
    """Yazim benzeri arama icin pencereler: bir kez hesaplanir, boyuta gore gruplanir."""
    plain = parts["plain"]
    by_size = {}
    for size in range(5, min(len(plain), 22) + 1):
        for i in range(0, len(plain) - size + 1):
            w = plain[i:i + size]
            by_size.setdefault(size, set()).add((w, deglyph(w)))
    for tok in parts["label_tokens"]:
        by_size.setdefault(len(tok), set()).add((tok, deglyph(tok)))
    return by_size


@lru_cache(maxsize=2048)
def detect_brand(host, path=""):
    """En guclu marka taklidi eslesmesini dondurur; yoksa None."""
    cat = catalog()
    parts = url_parts(host, path)
    if is_restricted(parts["host"], cat["restricted"]):
        return None

    # Katalogdaki herhangi bir kurumun resmi alan adi taklit sayilmaz
    # (trendyolexpress.com gibi kardes markalar birbirinin adini tasir)
    if any(is_official(parts["host"], brand) for brand in cat["brands"]):
        return None

    candidates = []
    windows = _windows(parts)

    for brand in cat["brands"]:
        lures = brand["lures"]
        lure_ctx = _has_lure(parts, lures)
        strong = brand["aliases"]
        weak = brand["weak_aliases"] if lure_ctx else []

        # 2) Kayitli alan adinda
        for alias in strong + weak:
            short = len(alias) <= 4
            tokens = parts["label_tokens"] + ([parts["plain"]] if not short else [])
            for tok in tokens:
                if (short and _short_hit(alias, tok, cat["all_lures"])) or (not short and _long_hit(alias, tok)):
                    candidates.append((0, _match(brand, "label", alias, tok)))
                    break

        # 3) Yazim benzeri (yalnizca uzun ifadeler). Markanin herhangi bir ifadesi alan adinda
        #    zaten aynen geciyorsa bu bilincli kullanimdir, yazim hatasi aranmaz (garantikasko).
        if not any(a in parts["plain"] for a in strong + brand["weak_aliases"] if len(a) >= 5):
            found = None
            for alias in strong:
                if len(alias) < 6:
                    continue
                limit = 2 if len(alias) >= 10 else 1
                for size in range(len(alias) - limit, len(alias) + limit + 1):
                    for w, w2 in windows.get(size, ()):
                        # Ucuz on filtre: taklitler cogunlukla ilk ya da son harfi korur
                        if w2[0] != alias[0] and w2[-1] != alias[-1]:
                            continue
                        if w2 == alias and w != alias:
                            found = _match(brand, "glyph", alias, w)
                            break
                        if w2 != alias and damerau(w2, alias, limit) <= limit:
                            found = _match(brand, "typo", alias, w)
                            break
                    if found:
                        break
                if found:
                    candidates.append((1, found))
                    break

        # 4) Alt alan adinda / 5) yolda
        for alias in strong + weak:
            if any(tok == alias or (len(alias) >= 5 and tok.startswith(alias)) for tok in parts["sub_tokens"]):
                candidates.append((2, _match(brand, "subdomain", alias, alias)))
                break
        for alias in strong:
            if len(alias) >= 4 and any(tok == alias for tok in parts["path_tokens"]):
                candidates.append((3, _match(brand, "path", alias, alias)))
                break

    if candidates:
        candidates.sort(key=lambda c: (c[0], -len(c[1]["token"])))
        return candidates[0][1]
    return None


def detect_fake_suffix(host):
    """'gov-tr', 'govtr', 'gov.tr' ifadesi gercek uzanti disinda kullanilmis mi?"""
    parts = url_parts(host)
    if is_restricted(parts["host"]):
        return None
    body = parts["host"][: -len(parts["reg"])] + parts["label"] if parts["host"].endswith(parts["reg"]) else parts["host"]
    m = FAKE_SUFFIX_RE.search(body)
    return f"{m.group(1)}.tr" if m else None


def detect_unlisted_gov(host, path=""):
    """Katalogda olmayan kamu kurumlari: belediye, valilik, bakanlik... + kamu tuzagi."""
    parts = url_parts(host, path)
    if is_restricted(parts["host"]):
        return None
    gov_lures = set(catalog()["sectors"]["government"]["lures"]) | set(catalog()["sectors"]["municipal"]["lures"])
    entity = next((w for w in GOV_ENTITY_WORDS if w in parts["blob"]), None)
    if entity and _has_lure(parts, gov_lures):
        return entity
    return None


def lure_words(host, path=""):
    """URL'de gecen sektor tuzak kelimeleri (tum sektorler)."""
    parts = url_parts(host, path)
    return sorted(parts["words"] & catalog()["all_lures"])


def _terms_in(text, brand, min_len=1):
    return [t for t in brand["terms"]
            if len(t) >= min_len and re.search(rf"(?<![a-z0-9]){re.escape(t)}(?![a-z0-9])", text)]


def detect_brand_in_content(page):
    """Sayfa icerigindeki marka kimligi.

    - Kimlik alanlari (baslik, site adi, h1) guclu kanittir.
    - Logolar ve govde metni yalnizca hassas form varsa ve sayfada TEK bir kurum geciyorsa
      sayilir; karsilastirma ve haber sitesi gibi cok markali sayfalar boylece elenir.
    - Sayfa katalogdaki herhangi bir kurumun resmi adresindeyse icerik taklidi aranmaz:
      resmi siteler ortaklarini anar (Garanti BBVA sayfasinda Miles&Smiles gibi)."""
    if not page:
        return None
    cat = catalog()
    host = page.get("final_host") or ""
    if host and (official_brand(host) or is_restricted(normalize_text(host))):
        return None

    identity = normalize_text(" ".join(page.get("identity", [])))
    logos = normalize_text(" ".join(page.get("logos", [])))
    body = normalize_text(page.get("text", ""))
    has_form = page.get("password_input") or page.get("card_input") or page.get("tckn_input")

    strong = []
    in_logos = []
    in_body = []
    for brand in cat["brands"]:
        hits = _terms_in(identity, brand)
        if hits:
            strong.append((brand, max(hits, key=len)))
            continue
        if has_form:
            hits = _terms_in(logos, brand, 4)
            if hits:
                in_logos.append((brand, max(hits, key=len)))
            hits = _terms_in(body, brand, 6)
            if hits:
                in_body.append((brand, max(hits, key=len)))

    if strong:
        brand, term = max(strong, key=lambda x: len(x[1]))
        return {"brand": brand, "zone": "identity", "term": term}
    # Oltalama sayfalari 1-3 logo gosterir; onlarca logolu "musterilerimiz" duvarlari
    # kurumsal tanitim sayfalarina ozgudur ve logo kaniti sayilmaz
    logo_labels = {l.strip().lower() for l in page.get("logos", []) if l and l.strip()}
    if len({b["id"] for b, _ in in_logos}) == 1 and len(logo_labels) <= 8:
        brand, term = in_logos[0]
        return {"brand": brand, "zone": "logo", "term": term}
    if len({b["id"] for b, _ in in_body}) == 1:
        brand, term = in_body[0]
        return {"brand": brand, "zone": "body", "term": term}
    return None
