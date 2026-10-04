import base64
import time

import requests

from backend.config import settings

ABUSEIPDB_URL = "https://api.abuseipdb.com/api/v2/check"
VIRUSTOTAL_URL = "https://www.virustotal.com/api/v3/urls/{url_id}"
REQUEST_TIMEOUT = 6
CACHE_TTL_SECONDS = 30 * 60

STATUS_OK = "ok"
STATUS_NO_KEY = "no_api_key"
STATUS_NOT_FOUND = "not_found"
STATUS_ERROR = "error"

_cache = {}


def _cached(key):
    entry = _cache.get(key)
    if entry and time.time() - entry[0] < CACHE_TTL_SECONDS:
        return dict(entry[1])
    return None


def _store(key, value):
    _cache[key] = (time.time(), value)
    return dict(value)


def check_ip_reputation(ip_address):
    result = {"abuse_score": None, "reports_count": None, "status": STATUS_NO_KEY}
    if not ip_address:
        return {"abuse_score": None, "reports_count": None, "status": STATUS_NOT_FOUND}
    if not settings.ABUSEIPDB_API_KEY:
        return result

    key = f"abuse:{ip_address}"
    hit = _cached(key)
    if hit:
        return hit

    try:
        response = requests.get(
            ABUSEIPDB_URL,
            headers={"Key": settings.ABUSEIPDB_API_KEY, "Accept": "application/json"},
            params={"ipAddress": ip_address, "maxAgeInDays": 90},
            timeout=REQUEST_TIMEOUT,
        )
    except requests.RequestException:
        return {"abuse_score": None, "reports_count": None, "status": STATUS_ERROR}

    if response.status_code == 404:
        return _store(key, {"abuse_score": None, "reports_count": None, "status": STATUS_NOT_FOUND})
    if response.status_code != 200:
        return {"abuse_score": None, "reports_count": None, "status": STATUS_ERROR}

    try:
        data = response.json().get("data") or {}
    except ValueError:
        return {"abuse_score": None, "reports_count": None, "status": STATUS_ERROR}

    return _store(key, {
        "abuse_score": data.get("abuseConfidenceScore"),
        "reports_count": data.get("totalReports"),
        "status": STATUS_OK,
    })


def _vt_url_id(url):
    return base64.urlsafe_b64encode(url.encode("utf-8")).decode("ascii").rstrip("=")


def check_url_reputation(url):
    result = {"vt_positives": None, "vt_total": None, "status": STATUS_NO_KEY}
    if not url:
        return {"vt_positives": None, "vt_total": None, "status": STATUS_NOT_FOUND}
    if not settings.VIRUSTOTAL_API_KEY:
        return result

    key = f"vt:{url}"
    hit = _cached(key)
    if hit:
        return hit

    try:
        response = requests.get(
            VIRUSTOTAL_URL.format(url_id=_vt_url_id(url)),
            headers={"x-apikey": settings.VIRUSTOTAL_API_KEY},
            timeout=REQUEST_TIMEOUT,
        )
    except requests.RequestException:
        return {"vt_positives": None, "vt_total": None, "status": STATUS_ERROR}

    if response.status_code == 404:
        return _store(key, {"vt_positives": None, "vt_total": None, "status": STATUS_NOT_FOUND})
    if response.status_code != 200:
        return {"vt_positives": None, "vt_total": None, "status": STATUS_ERROR}

    try:
        stats = response.json()["data"]["attributes"]["last_analysis_stats"]
    except (ValueError, KeyError, TypeError):
        return {"vt_positives": None, "vt_total": None, "status": STATUS_ERROR}

    malicious = int(stats.get("malicious", 0)) + int(stats.get("suspicious", 0))
    total = sum(int(v) for v in stats.values() if isinstance(v, (int, float)))

    return _store(key, {"vt_positives": malicious, "vt_total": total, "status": STATUS_OK})
