from backend.models.list_model import ListModel
from backend.core.list_utils import extract_host

DEFAULT_WHITELIST = {
    "google.com": "Google", "microsoft.com": "Microsoft", "live.com": "Microsoft",
    "office.com": "Microsoft", "apple.com": "Apple", "icloud.com": "Apple",
    "amazon.com": "Amazon", "github.com": "GitHub", "linkedin.com": "LinkedIn",
    "facebook.com": "Meta", "instagram.com": "Meta", "whatsapp.com": "Meta",
    "x.com": "X", "twitter.com": "X", "youtube.com": "Google",
    "paypal.com": "PayPal", "cloudflare.com": "Cloudflare",
    "wikipedia.org": "Wikipedia", "turkiye.gov.tr": "e-Devlet",
    "trendyol.com": "Trendyol", "hepsiburada.com": "Hepsiburada",
}


def seed_default_whitelist(db):
    existing = {
        extract_host(e.pattern)
        for e in db.query(ListModel).filter(ListModel.list_type == "whitelist").all()
    }
    for domain, desc in DEFAULT_WHITELIST.items():
        if domain not in existing:
            db.add(ListModel(
                list_type="whitelist",
                pattern=domain,
                description=f"Varsayılan güvenilir: {desc}",
            ))
    db.commit()
