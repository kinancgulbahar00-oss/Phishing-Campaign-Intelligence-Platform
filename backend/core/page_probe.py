"""Sayfa icerigi yoklamasi.

Adreste marka gecmese bile oltalama sayfalari kimligini iceriginde tasir: baslikta
"Garanti BBVA", bir sifre ya da kart formu, verileri Telegram botuna gonderen kod.
Bu modul sayfayi JavaScript calistirmadan, boyut ve sure sinirli olarak indirir.

Guvenlik: sunucunun ic agina istek atilmamasi (SSRF) icin yalnizca herkese acik
IP adreslerine baglanilir; her yonlendirme adimi yeniden denetlenir.
"""

import ipaddress
import re
import socket
import time
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse

import requests

from backend.config import settings

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/129.0 Safari/537.36"
)
MAX_BYTES = 600_000
MAX_REDIRECTS = 4
TIMEOUT = (4, 6)
CACHE_TTL_SECONDS = 15 * 60

_cache = {}

PASSWORD_HINTS = ("password", "sifre", "parola", "passwd", "pin")
CARD_HINTS = ("cardnumber", "card_number", "ccnumber", "cc-number", "kartno", "kart_no", "kartnumarasi", "cvv", "cvc",
              "cvv2", "sonkullanma", "son_kullanma", "expiry", "exp-date", "skt")
TCKN_HINTS = ("tckn", "tcno", "tc_no", "tckimlik", "tc-kimlik", "kimlikno", "kimlik_no", "tcid")
PHONE_HINTS = ("telefon", "gsm", "phone", "cep")
SMS_HINTS = ("smskod", "sms_kod", "otp", "dogrulamakodu", "onaykodu", "verificationcode")


def _is_public(host):
    try:
        infos = socket.getaddrinfo(host, None)
    except (OSError, UnicodeError):
        return False
    for info in infos:
        try:
            ip = ipaddress.ip_address(info[4][0])
        except ValueError:
            return False
        if not ip.is_global or ip.is_multicast:
            return False
    return bool(infos)


class _PageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title = ""
        self.identity = []
        self.logos = []
        self.inputs = []
        self.forms = []
        self.text = []
        self._in = None
        self._skip = 0

    def handle_starttag(self, tag, attrs):
        a = {k.lower(): (v or "") for k, v in attrs}
        if tag in ("script", "style", "noscript"):
            self._skip += 1
        if tag in ("title", "h1"):
            self._in = tag
        if tag == "meta" and a.get("property", a.get("name", "")).lower() in ("og:site_name", "og:title", "application-name"):
            self.identity.append(a.get("content", ""))
        if tag == "img":
            self.logos.append(a.get("alt", ""))
            self.logos.append(re.sub(r"[^A-Za-z0-9]+", " ", a.get("src", "").rsplit("/", 1)[-1]))
        if tag == "link" and "icon" in a.get("rel", "").lower():
            self.logos.append(re.sub(r"[^A-Za-z0-9]+", " ", a.get("href", "").rsplit("/", 1)[-1]))
        if tag == "form":
            self.forms.append(a.get("action", ""))
        if tag in ("input", "select", "textarea"):
            self.inputs.append(" ".join([a.get("type", ""), a.get("name", ""), a.get("id", ""),
                                         a.get("placeholder", ""), a.get("autocomplete", ""),
                                         a.get("aria-label", "")]).lower())

    def handle_endtag(self, tag):
        if tag in ("script", "style", "noscript") and self._skip:
            self._skip -= 1
        if tag == self._in:
            self._in = None

    def handle_data(self, data):
        if self._in == "title":
            self.title += data
        if self._in in ("title", "h1"):
            self.identity.append(data)
        if not self._skip and len(self.text) < 4000:
            chunk = data.strip()
            if chunk:
                self.text.append(chunk)


def _flatten(s):
    return re.sub(r"[^a-z0-9]", "", s.lower().translate(str.maketrans("ışğüöç", "isguoc")))


def _has(inputs, hints):
    return any(any(h in _flatten(i) for h in hints) for i in inputs)


def probe_page(url):
    """Sayfayi indirir ve oltalama icin anlamli ozellikleri cikarir. Basarisizsa status ile doner."""
    if not getattr(settings, "PAGE_FETCH_ENABLED", True):
        return {"status": "disabled"}

    cached = _cache.get(url)
    if cached and time.time() - cached[0] < CACHE_TTL_SECONDS:
        return dict(cached[1])

    session = requests.Session()
    chain = [url]
    current = url
    response = None
    try:
        for _ in range(MAX_REDIRECTS + 1):
            host = urlparse(current).hostname
            if not host or not _is_public(host):
                return _store(url, {"status": "blocked", "redirects": chain})
            response = session.get(
                current, headers={"User-Agent": USER_AGENT, "Accept-Language": "tr-TR,tr;q=0.9"},
                timeout=TIMEOUT, allow_redirects=False, stream=True,
            )
            if response.is_redirect or response.status_code in (301, 302, 303, 307, 308):
                nxt = response.headers.get("Location")
                response.close()
                if not nxt:
                    break
                current = urljoin(current, nxt)
                chain.append(current)
                continue
            break
        else:
            return _store(url, {"status": "too_many_redirects", "redirects": chain})

        if response is None:
            return _store(url, {"status": "error", "redirects": chain})

        ctype = response.headers.get("Content-Type", "")
        raw = b""
        for chunk in response.iter_content(32_768):
            raw += chunk
            if len(raw) >= MAX_BYTES:
                break
        response.close()
    except requests.RequestException:
        return _store(url, {"status": "error", "redirects": chain})

    final_host = (urlparse(current).hostname or "").lower()
    result = {
        "status": "ok",
        "http_status": response.status_code,
        "final_url": current,
        "final_host": final_host,
        "redirects": chain,
    }
    if "html" not in ctype.lower() and b"<html" not in raw[:2000].lower():
        result.update({"title": None, "identity": [], "text": "", "fields": []})
        return _store(url, result)

    html = raw.decode(response.encoding or "utf-8", errors="ignore")
    parser = _PageParser()
    try:
        parser.feed(html)
    except Exception:
        pass

    inputs = parser.inputs
    password = any("password" in i.split(" ")[0] for i in inputs) or _has(inputs, PASSWORD_HINTS)
    card = _has(inputs, CARD_HINTS)
    tckn = _has(inputs, TCKN_HINTS)
    sms = _has(inputs, SMS_HINTS)
    phone = _has(inputs, PHONE_HINTS)

    form_hosts = set()
    for action in parser.forms:
        target = urlparse(urljoin(current, action)).hostname
        if target and target.lower() != final_host:
            form_hosts.add(target.lower())

    lowered = html.lower()
    exfil = None
    if "api.telegram.org/bot" in lowered:
        exfil = "Telegram bot API"
    elif "discord.com/api/webhooks" in lowered or "discordapp.com/api/webhooks" in lowered:
        exfil = "Discord webhook"

    fields = []
    if password:
        fields.append("Şifre")
    if card:
        fields.append("Kart bilgisi")
    if tckn:
        fields.append("T.C. kimlik no")
    if sms:
        fields.append("SMS doğrulama kodu")
    if phone:
        fields.append("Telefon")

    result.update({
        "title": re.sub(r"\s+", " ", parser.title).strip()[:160] or None,
        "identity": [x for x in parser.identity if x and x.strip()][:20],
        "logos": [x for x in parser.logos if x and x.strip()][:80],
        "text": " ".join(parser.text)[:20_000],
        "password_input": password,
        "card_input": card,
        "tckn_input": tckn,
        "sms_input": sms,
        "fields": fields,
        "external_form_hosts": sorted(form_hosts),
        "exfil": exfil,
    })
    return _store(url, result)


def _store(key, value):
    _cache[key] = (time.time(), value)
    return dict(value)
