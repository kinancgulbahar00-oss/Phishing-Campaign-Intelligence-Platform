export const SEVERITY = {
  critical: { label: 'Kritik', text: 'text-risk-critical', dot: 'bg-risk-critical', ring: 'border-risk-critical/40', tint: 'bg-risk-critical/10', rank: 0 },
  high: { label: 'Yüksek', text: 'text-risk-high', dot: 'bg-risk-high', ring: 'border-risk-high/40', tint: 'bg-risk-high/10', rank: 1 },
  medium: { label: 'Orta', text: 'text-risk-medium', dot: 'bg-risk-medium', ring: 'border-risk-medium/40', tint: 'bg-risk-medium/10', rank: 2 },
  low: { label: 'Düşük', text: 'text-risk-low', dot: 'bg-risk-low', ring: 'border-risk-low/40', tint: 'bg-risk-low/10', rank: 3 },
  info: { label: 'Bilgi', text: 'text-risk-info', dot: 'bg-risk-info', ring: 'border-risk-info/40', tint: 'bg-risk-info/10', rank: 4 },
};

export const severityOf = (key) => SEVERITY[String(key || '').toLowerCase()] || SEVERITY.info;

export function levelFromScore(score) {
  const n = Number(score) || 0;
  if (n >= 75) return SEVERITY.critical;
  if (n >= 50) return SEVERITY.high;
  if (n >= 25) return SEVERITY.medium;
  return SEVERITY.low;
}
