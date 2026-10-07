from urllib.parse import urlparse
import ipaddress


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
    # IP ise sadece birebir eşleşme
    try:
        ipaddress.ip_address(host)
        return host == pattern_host
    except ValueError:
        pass
    return host == pattern_host or host.endswith("." + pattern_host)
