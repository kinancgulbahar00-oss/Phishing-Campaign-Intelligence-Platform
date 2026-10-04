import socket
import time
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeout, as_completed
from difflib import SequenceMatcher

SWAP_TLDS = ("com", "net", "org", "info", "co", "xyz", "top", "online", "site")
BAIT_WORDS = ("secure", "login", "verify", "account", "destek", "giris")
HOMOGLYPHS = {"o": "0", "i": "1", "l": "1", "e": "3", "a": "4", "s": "5"}
MAX_CANDIDATES = 60
MAX_RESULTS = 8
RESOLVE_BUDGET_SECONDS = 4
CACHE_TTL_SECONDS = 60 * 60

_cache = {}


def _split_domain(domain):
    parts = domain.strip(".").lower().split(".")
    if len(parts) < 2:
        return None, None
    return parts[0], ".".join(parts[1:])


def _variants(label):
    seen = set()
    out = []

    def add(value):
        if value and value != label and value not in seen and len(value) > 1:
            seen.add(value)
            out.append(value)

    for i in range(len(label)):
        add(label[:i] + label[i + 1:])
        add(label[:i] + label[i] * 2 + label[i + 1:])
        if i + 1 < len(label):
            add(label[:i] + label[i + 1] + label[i] + label[i + 2:])
        replacement = HOMOGLYPHS.get(label[i])
        if replacement:
            add(label[:i] + replacement + label[i + 1:])

    for word in BAIT_WORDS:
        add(f"{label}-{word}")
        add(f"{word}-{label}")

    return out


def _candidates(domain):
    label, suffix = _split_domain(domain)
    if not label:
        return []

    out = []
    seen = {domain}

    def add(value):
        if value not in seen:
            seen.add(value)
            out.append(value)

    for tld in SWAP_TLDS:
        add(f"{label}.{tld}")

    for variant in _variants(label):
        add(f"{variant}.{suffix}")

    return out[:MAX_CANDIDATES]


def _resolve(name):
    try:
        return name, socket.gethostbyname(name)
    except (OSError, UnicodeError):
        return name, None


def _similarity(original, candidate):
    return int(round(SequenceMatcher(None, original, candidate).ratio() * 100))


def find_related_domains(domain):
    if not domain:
        return []

    key = domain.lower()
    entry = _cache.get(key)
    if entry and time.time() - entry[0] < CACHE_TTL_SECONDS:
        return [dict(d) for d in entry[1]]

    candidates = _candidates(key)
    if not candidates:
        return []

    found = []
    executor = ThreadPoolExecutor(max_workers=16)
    futures = [executor.submit(_resolve, c) for c in candidates]
    try:
        for future in as_completed(futures, timeout=RESOLVE_BUDGET_SECONDS):
            try:
                name, address = future.result()
            except Exception:
                continue
            if address:
                found.append({"domain": name, "similarity": _similarity(key, name)})
    except FuturesTimeout:
        pass
    finally:
        executor.shutdown(wait=False, cancel_futures=True)

    found.sort(key=lambda item: (-item["similarity"], item["domain"]))
    found = found[:MAX_RESULTS]

    _cache[key] = (time.time(), found)
    return [dict(d) for d in found]
