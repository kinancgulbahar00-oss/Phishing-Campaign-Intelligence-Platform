// Skor bantlari backend/core/analyzer_interface.py ile birebir aynidir.
export const BANDS = [
  { key: 'low', from: 0, to: 24, label: 'Düşük risk' },
  { key: 'medium', from: 25, to: 49, label: 'Dikkat' },
  { key: 'high', from: 50, to: 74, label: 'Şüpheli' },
  { key: 'critical', from: 75, to: 100, label: 'Zararlı' },
];

export const SEVERITY = {
  critical: { label: 'Kritik', text: 'text-risk-critical', bg: 'bg-risk-critical', soft: 'bg-risk-critical/[0.07]', rank: 0 },
  high: { label: 'Yüksek', text: 'text-risk-high', bg: 'bg-risk-high', soft: 'bg-risk-high/[0.07]', rank: 1 },
  medium: { label: 'Orta', text: 'text-risk-medium', bg: 'bg-risk-medium', soft: 'bg-risk-medium/[0.08]', rank: 2 },
  low: { label: 'Düşük', text: 'text-risk-low', bg: 'bg-risk-low', soft: 'bg-risk-low/[0.07]', rank: 3 },
  unknown: { label: 'Bilgi', text: 'text-risk-unknown', bg: 'bg-risk-unknown', soft: 'bg-risk-unknown/[0.07]', rank: 4 },
};

export const severityKey = (value) => {
  const k = String(value || '').toLowerCase();
  if (k === 'safe') return 'low';
  return SEVERITY[k] ? k : 'unknown';
};

export const severityOf = (value) => SEVERITY[severityKey(value)];

export function bandOf(score) {
  const n = Math.max(0, Math.min(100, Number(score) || 0));
  return BANDS.find((b) => n >= b.from && n <= b.to) || BANDS[0];
}

// Karar kelimesi once, sayi sonra. Tahmin dili skor bandindan turetilir.
const VERDICTS = {
  critical: { word: 'Zararlı', sentence: 'neredeyse kesin olarak bir oltalama altyapısına aittir' },
  high: { word: 'Şüpheli', sentence: 'büyük olasılıkla oltalama amaçlıdır' },
  medium: { word: 'Dikkat', sentence: 'oltalama amaçlı olabilir; ek doğrulama önerilir' },
  low: { word: 'Düşük risk', sentence: 'için bilinen bir oltalama göstergesi saptanmadı' },
  safe: { word: 'İzinli', sentence: 'analist izin listesinde yer alıyor; harici sorgular atlandı' },
};

export function verdictOf(data) {
  const level = String(data?.risk_level || '').toLowerCase();
  if (level === 'safe') return { key: 'low', ...VERDICTS.safe, listMatch: 'whitelist' };
  const key = bandOf(data?.risk_score).key;
  const listMatch = data?.ioc_details?.abuse_status === 'blacklisted' ? 'blacklist' : null;
  return { key, ...VERDICTS[key], listMatch };
}

// Kayit numarasi: backend IOC kimligi varsa ondan, yoksa zaman damgasindan
export function referenceOf(data, date) {
  if (data?.id != null) return `MHK-${String(data.id).padStart(6, '0')}`;
  const d = date || new Date();
  return `MHK-${d.getTime().toString(36).toUpperCase().slice(-6)}`;
}

export function formatStamp(date) {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatAge(days) {
  if (days == null) return null;
  if (days < 1) return 'Bugün kaydedildi';
  if (days < 365) return `${days} gün`;
  const years = (days / 365).toFixed(1).replace('.', ',');
  return `${days.toLocaleString('tr-TR')} gün · ~${years} yıl`;
}
