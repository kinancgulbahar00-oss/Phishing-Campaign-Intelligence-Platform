import { formatAge } from '../../lib/verdict';

const STATUS = {
  no_api_key: 'API anahtarı tanımsız',
  not_found: 'Kayıt bulunamadı',
  error: 'Kaynak yanıt vermedi',
};

const missing = (status) => ({ value: null, missing: STATUS[status] || 'Veri yok' });

// Her satir: kaynak, gozlem, deger ve gerekiyorsa bir isaret.
// Deger yoksa "temiz" gibi gosterilmez; neden olmadigi yazilir.
export function evidenceRows(ioc = {}, listMatch) {
  const skipped = listMatch ? { value: null, missing: 'Liste eşleşmesi' } : null;
  const age = ioc.domain_age_days;

  const rows = [
    {
      source: 'WHOIS',
      label: 'Kayıt kuruluşu',
      ...(skipped || (ioc.registrar ? { value: ioc.registrar } : missing('not_found'))),
    },
    {
      source: 'WHOIS',
      label: 'Kayıt tarihi',
      ...(skipped || (ioc.domain_registration_date ? { value: ioc.domain_registration_date, mono: true } : missing('not_found'))),
    },
    {
      source: 'WHOIS',
      label: 'Alan adı yaşı',
      ...(skipped ||
        (age != null
          ? { value: formatAge(age), mono: age >= 1, flag: age < 30 ? { severity: 'high', text: 'Yeni kayıt' } : null }
          : missing('not_found'))),
    },
    {
      source: 'DNS',
      label: 'Çözümlenen IP',
      ...(skipped || (ioc.ip_address ? { value: ioc.ip_address, mono: true } : { value: null, missing: 'Çözümlenemedi' })),
    },
    {
      source: 'AbuseIPDB',
      label: 'Kötüye kullanım skoru',
      ...(skipped ||
        (ioc.abuse_score != null
          ? {
              value: `%${ioc.abuse_score}`,
              mono: true,
              flag: ioc.abuse_score >= 50 ? { severity: 'high', text: 'Kötü itibar' } : null,
            }
          : missing(ioc.abuse_status))),
    },
    {
      source: 'AbuseIPDB',
      label: 'Rapor sayısı',
      ...(skipped ||
        (ioc.ip_reports_count != null ? { value: String(ioc.ip_reports_count), mono: true } : missing(ioc.abuse_status))),
    },
    {
      source: 'VirusTotal',
      label: 'Zararlı tespiti',
      ...(skipped ||
        (ioc.vt_positives != null && ioc.vt_total != null
          ? {
              value: `${ioc.vt_positives} / ${ioc.vt_total} motor`,
              mono: true,
              flag: ioc.vt_positives > 0 ? { severity: 'critical', text: 'Tespit var' } : null,
            }
          : missing(ioc.vt_status))),
    },
    {
      source: 'Bağlantı',
      label: 'HTTPS',
      ...httpsRow(ioc, listMatch),
    },
  ];

  rows.push(...pageRows(ioc, listMatch));
  return rows;
}

const PAGE_STATUS = {
  blocked: 'Özel ağ adresine çözümlendi, indirilmedi',
  error: 'Sayfa yüklenemedi',
  unreachable: 'Sunucuya erişilemedi',
  too_many_redirects: 'Çok fazla yönlendirme',
  disabled: 'Sayfa analizi kapalı',
};

function pageRows(ioc, listMatch) {
  if (listMatch) return [{ source: 'Sayfa', label: 'İçerik', value: null, missing: 'Liste eşleşmesi' }];
  if (ioc.page_status && ioc.page_status !== 'ok') {
    return [{ source: 'Sayfa', label: 'İçerik', value: null, missing: PAGE_STATUS[ioc.page_status] || 'Veri yok' }];
  }
  if (!ioc.page_status) return [];
  const fields = (ioc.page_fields || []).filter((f) => f !== 'Telefon');
  const rows = [
    { source: 'Sayfa', label: 'Başlık', ...(ioc.page_title ? { value: ioc.page_title } : { value: null, missing: 'Başlık yok' }) },
    {
      source: 'Sayfa',
      label: 'İstenen bilgiler',
      ...(fields.length
        ? { value: fields.join(', '), flag: { severity: 'high', text: 'Hassas veri' } }
        : { value: 'Hassas alan yok' }),
    },
  ];
  if (ioc.final_url) {
    rows.push({ source: 'Sayfa', label: 'Yönlendirme', value: ioc.final_url, mono: true });
  }
  return rows;
}

function httpsRow(ioc, listMatch) {
  if (ioc.tls_status === 'invalid') {
    return { value: 'Var', flag: { severity: 'high', text: 'Geçersiz sertifika' } };
  }
  if (ioc.tls_status === 'unreachable') return { value: null, missing: 'Sunucuya erişilemedi' };
  if (ioc.has_https) return { value: ioc.tls_status === 'valid' ? 'Var, sertifika geçerli' : 'Var' };
  if (listMatch) return { value: null, missing: 'Liste eşleşmesi' };
  return { value: 'Yok', flag: { severity: 'medium', text: 'Şifresiz' } };
}

const PAGE_SHORT = { blocked: 'Engellendi', error: 'Yüklenemedi', unreachable: 'Erişilemedi', disabled: 'Kapalı' };

// Kaynak kapsami: hangi saglayici yanit verdi
export function coverageOf(ioc = {}, listMatch) {
  const sources = [
    { name: 'WHOIS', ok: ioc.registrar != null || ioc.domain_age_days != null, status: 'not_found' },
    { name: 'DNS', ok: !!ioc.ip_address, status: 'error' },
    { name: 'AbuseIPDB', ok: ioc.abuse_score != null, status: ioc.abuse_status },
    { name: 'VirusTotal', ok: ioc.vt_positives != null, status: ioc.vt_status },
    { name: 'Sayfa içeriği', ok: ioc.page_status === 'ok', status: ioc.page_status, page: true },
  ];
  return sources.map((s) => ({
    name: s.name,
    ok: listMatch ? false : s.ok,
    note: listMatch ? 'Atlandı' : s.ok ? 'Yanıt verdi' : (s.page ? PAGE_SHORT[s.status] : STATUS[s.status]) || 'Veri yok',
  }));
}
