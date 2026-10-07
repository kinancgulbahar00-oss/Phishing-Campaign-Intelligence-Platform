"""Marka ve kurum taklidi tespiti testleri. Ag erisimi gerektirmez.

Calistirma:  py -3.11 -m pytest backend/tests -q
"""

import pytest

from backend.core.analyzer_interface import normalized_url, parse_url_components
from backend.core.brands import catalog, detect_brand
from backend.core.scoring import collect_signals, score_signals


def analyze(raw, age=None, page=None, tls=None):
    p = parse_url_components(raw)
    url = normalized_url(p, p["scheme"] or "https")
    signals, mitigations, ctx = collect_signals(
        {**p, "url": url},
        {"tls": tls, "age_days": age, "resolved": True, "page": page},
    )
    score, level, reasons = score_signals(signals, mitigations)
    assert sum(r["contribution"] for r in reasons) == score, "katkilarin toplami skora esit olmali"
    return score, level, ctx, reasons


# --- Yakalanmasi gerekenler: (adres, beklenen kurum, alan adi yasi) -----------------
PHISHING = [
    ("garantibbva-bonus-kampanya.com", "Garanti BBVA", 5),
    ("garanti-kredi-basvuru.xyz", "Garanti BBVA", 2),
    ("garamtibbva.com", "Garanti BBVA", 10),
    ("ziraatbank-onay.net", "Ziraat Bankası", 3),
    ("ziraat-internet-subesi.com", "Ziraat Bankası", 3),
    ("isbankasi-musteri.com", "Türkiye İş Bankası", 1),
    ("yapikredi-worldpuan.online", "Yapı Kredi", 4),
    ("akbnak-giris.com", "Akbank", 8),
    ("axess-puan-iade.com", "Akbank", 2),
    ("vakifbank-kart-limit.com", "VakıfBank", 2),
    ("halkbank-kredi.site", "Halkbank", 5),
    ("qnbfinansbank-mobil.com", "QNB", 3),
    ("denizbank-musteri.net", "DenizBank", 6),
    ("kuveytturk-giris.com", "Kuveyt Türk", 6),
    ("papara-bakiye-iade.com", "Papara", 2),
    ("edevlet-giris.com", "e-Devlet Kapısı", 1),
    ("turkiye-gov-tr.com", "e-Devlet Kapısı", 1),
    ("edevlet.gov.tr.destek-odemesi.xyz", "e-Devlet Kapısı", 1),
    ("hgs-ceza-odeme.com", "Karayolları / HGS", 4),
    ("hgsborc-sorgula.net", "Karayolları / HGS", 4),
    ("sgk-emekli-ikramiye.com", "Sosyal Güvenlik Kurumu", 3),
    ("gib-vergi-iade.com", "Gelir İdaresi Başkanlığı", 2),
    ("trafikcezasi-sorgula.com", "Emniyet Genel Müdürlüğü", 2),
    ("e-tebligat-uyap.com", "Adalet Bakanlığı / UYAP", 2),
    ("ptt-kargo-takip.top", "PTT", 1),
    ("pttkargo-gumruk.com", "PTT", 1),
    ("yurticikargo-teslimat.com", "Yurtiçi Kargo", 2),
    ("araskargo-adres-guncelle.com", "Aras Kargo", 2),
    ("mngkargo-odeme.net", "MNG Kargo", 2),
    ("trendyol-hediye-ceki.com", "Trendyol", 3),
    ("hepsiburada-cekilis.site", "Hepsiburada", 3),
    ("sahibinden-odeme-guvence.com", "sahibinden.com", 5),
    ("turkcell-hediye-internet.com", "Turkcell", 3),
    ("vodafone-fatura-iade.com", "Vodafone", 3),
    ("turktelekom-borc.net", "Türk Telekom", 3),
    ("enerjisa-fatura-iade.com", "Enerjisa", 3),
    ("igdas-borc-odeme.com", "İGDAŞ", 3),
    ("istanbulkart-bakiye.com", "İstanbulkart", 3),
    ("thy-milesandsmiles-mil.com", "Türk Hava Yolları", 3),
    ("turkishairlines-bilet-iade.com", "Türk Hava Yolları", 3),
    ("btcturk-airdrop.com", "BtcTurk", 3),
    ("paribu-giris.net", "Paribu", 3),
    ("binance-tr-claim.com", "Binance", 3),
    ("millipiyango-ikramiye.com", "Milli Piyango", 3),
    ("kizilay-deprem-bagis.com", "Türk Kızılay", 3),
    ("afad-deprem-yardim.org", "AFAD", 3),
    ("togg-onsiparis.com", "Togg", 3),
    ("instagram-telif-dogrula.com", "Instagram", 3),
    ("whatsapp-hesap-onay.com", "WhatsApp", 3),
    ("secure.garantibbva.com.tr.hesap-onay.xyz", "Garanti BBVA", 3),
    ("bonus-kart-puan.com", "Garanti BBVA", 3),
    ("xn--garant-bbva-ppb.com", None, 3),
    ("istanbul-belediyesi-su-fatura.com", "Kamu kurumu (katalog dışı)", 3),
    ("valiligi-destek-odemesi.com", "Kamu kurumu (katalog dışı)", 3),
]


@pytest.mark.parametrize("raw,brand,age", PHISHING)
def test_phishing_detected(raw, brand, age):
    score, level, ctx, reasons = analyze(raw, age=age)
    assert score >= 50, f"{raw}: skor {score}, bulgular {[(r['rule_name'], r['contribution']) for r in reasons]}"
    if brand:
        assert ctx["target_brand"] == brand, f"{raw}: hedef {ctx['target_brand']}"


# --- Mesru siteler: resmi alan adlari ve kokleri eski, ilgisiz siteler ---------------
LEGIT = [
    ("garantibbva.com.tr", 9000),
    ("www.garantibbva.com.tr/kredi-karti", 9000),
    ("bonus.com.tr", 7000),
    ("ziraatbank.com.tr/tr/bireysel", 8000),
    ("turkiye.gov.tr/edevlet-giris", 6000),
    ("giris.turkiye.gov.tr", 6000),
    ("ivd.gib.gov.tr", 6000),
    ("hgs.ptt.gov.tr", 6000),
    ("kargotakip.ptt.gov.tr", 6000),
    ("trendyolexpress.com/takip", 2500),
    ("trendyol.com/siparislerim", 4000),
    ("hepsiburada.com/kampanyalar", 7000),
    ("izmir.bel.tr/tr/su-fatura", 7000),
    ("ankara.edu.tr", 9000),
    ("istanbul.edu.tr/basvuru", 9000),
    ("pineapple.com", 5000),
    ("garantiliservis.com", 4000),
    ("adalethukuk.com", 3000),
    ("acibadempastanesi.com", 3000),
    ("kizilaydiskliniği.com", 2500),
    ("economicoutlook.org", 4000),
    ("github.com/login", 6900),
    ("ekonomi.haberturk.com/akbank-kar-acikladi", 8000),
    ("tapuemlak.com", 3000),
]


@pytest.mark.parametrize("raw,age", LEGIT)
def test_legit_not_flagged(raw, age):
    score, level, ctx, reasons = analyze(raw, age=age, tls="valid" if False else None)
    assert score < 50, f"{raw}: skor {score}, bulgular {[(r['rule_name'], r['contribution']) for r in reasons]}"


# --- Sayfa icerigi: adreste marka yokken ---------------------------------------------
def page(title, fields=(), identity=(), text="", exfil=None, host="xk7-portal.com"):
    fields = list(fields)
    return {
        "status": "ok", "final_host": host, "final_url": f"https://{host}/",
        "title": title, "identity": [title, *identity], "text": text,
        "password_input": "Şifre" in fields, "card_input": "Kart bilgisi" in fields,
        "tckn_input": "T.C. kimlik no" in fields, "sms_input": "SMS doğrulama kodu" in fields,
        "fields": fields, "external_form_hosts": [], "exfil": exfil,
    }


def test_content_brand_with_password_form():
    score, level, ctx, _ = analyze("xk7-portal.com/a", age=4,
                                   page=page("Garanti BBVA İnternet Şubesi", ["Şifre", "T.C. kimlik no"]))
    assert level == "CRITICAL" and ctx["target_brand"] == "Garanti BBVA"


def test_content_edevlet_card_harvest():
    score, level, ctx, _ = analyze("odeme-merkezi.online", age=None,
                                   page=page("e-Devlet Kapısı", ["Kart bilgisi", "SMS doğrulama kodu"]))
    assert score >= 85 and ctx["target_brand"] == "e-Devlet Kapısı"


def test_telegram_exfil_is_critical():
    score, level, _, _ = analyze("random-site.com", age=None,
                                 page=page("Giriş", ["Şifre"], exfil="Telegram bot API"))
    assert score >= 85


def test_official_page_content_not_flagged():
    score, level, _, _ = analyze("akbank.com", age=9000,
                                 page=page("Akbank İnternet Şubesi", ["Şifre"], host="www.akbank.com"))
    assert score < 25


def test_catalog_integrity():
    cat = catalog()
    assert len(cat["brands"]) >= 200
    for b in cat["brands"]:
        assert b["domains"], b["id"]
        assert b["aliases"] or b["weak_aliases"], b["id"]


def test_turkish_and_cyrillic_normalization():
    m = detect_brand("gаrаntibbvа-giris.com")  # Kiril 'а'
    assert m and m["brand"]["id"] == "garanti"


def test_every_official_domain_is_clean():
    """Katalogdaki her resmi adres (alt alan adi ve hassas yollarla) temiz kalmali."""
    flagged = []
    for b in catalog()["brands"]:
        for d in b["domains"]:
            for u in (d, f"www.{d}/giris", f"musteri.{d}/odeme"):
                score, *_ = analyze(u, age=None)
                if score >= 25:
                    flagged.append((u, score))
    assert not flagged, flagged[:10]


POPULAR_TR = (
    "hurriyet.com.tr sozcu.com.tr ntv.com.tr haberturk.com milliyet.com.tr sabah.com.tr cnnturk.com "
    "eksisozluk.com webtekno.com donanimhaber.com technopat.net yemek.com nefisyemektarifleri.com sporx.com "
    "fanatik.com.tr memurlar.net kariyer.net yenibiris.com emlakjet.com hepsiemlak.com zingat.com akakce.com "
    "cimri.com epey.com r10.net shiftdelete.net chip.com.tr mynet.com haberler.com onedio.com bloomberght.com "
    "dunya.com investing.com bigpara.hurriyet.com.tr doviz.com garantikasko.com kargonomi.com sigortam.net "
    "hangikredi.com teklifimgelsin.com"
).split()


@pytest.mark.parametrize("raw", POPULAR_TR)
def test_popular_turkish_sites_clean_without_age(raw):
    score, *_ = analyze(raw, age=None)
    assert score < 25


def test_official_site_mentioning_partner_brand_is_clean():
    """Gercek garantibbva.com.tr sayfasi THY ortak kartini anar; taklit sayilmamali."""
    p = page("Kendim İçin | Garanti BBVA", ["Şifre", "T.C. kimlik no"],
             identity=["Miles&Smiles Garanti BBVA", "Türk Hava Yolları"], host="www.garantibbva.com.tr")
    score, *_ = analyze("garantibbva.com.tr", age=9000, page=p)
    assert score < 25


def test_comparison_site_with_many_banks_is_clean():
    p = page("Kredi karşılaştır", ["Şifre"], host="kredi-karsilastir.com",
             text="Akbank Yapı Kredi Ziraat Bankası Halkbank VakıfBank faiz oranları")
    p["identity"] = ["Kredi karşılaştır"]
    score, *_ = analyze("kredi-karsilastir.com", age=2500, page=p)
    assert score < 50


def test_single_brand_logo_with_card_form():
    p = page("Ödeme", ["Kart bilgisi", "SMS doğrulama kodu"], host="guvenli-odeme-tr.com")
    p["identity"] = ["Ödeme"]
    p["logos"] = ["yurtici kargo logo", "yurticikargo png"]
    score, level, ctx, _ = analyze("guvenli-odeme-tr.com", age=2, page=p)
    assert ctx["target_brand"] == "Yurtiçi Kargo" and score >= 85
