import React from 'react';
import { Globe, Server, ShieldCheck, Fingerprint } from 'lucide-react';
import { Panel } from './ui/Panel';

function Field({ label, value, tone = 'default' }) {
  const toneClass =
    tone === 'bad' ? 'text-risk-critical' : tone === 'good' ? 'text-risk-low' : 'text-ink-2';
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <dt className="text-xs text-ink-3">{label}</dt>
      <dd className={`data text-xs font-medium ${toneClass}`}>{value}</dd>
    </div>
  );
}

function statusLabel(status) {
  if (status === 'no_api_key') return 'API anahtarı tanımsız';
  if (status === 'not_found') return 'Kayıt bulunamadı';
  if (status === 'error') return 'Sorgulanamadı';
  return 'Bilinmiyor';
}

function formatAge(days) {
  if (days == null) return 'Bilinmiyor';
  if (days < 365) return `${days} gün`;
  return `${days} gün (~${(days / 365).toFixed(1)} yıl)`;
}

function Card({ icon: Icon, label, value, children }) {
  return (
    <article className="rounded-[10px] border border-line bg-surface-2 p-4 transition-colors duration-200 hover:border-line-strong hover:bg-surface-3">
      <div className="flex items-center gap-2 text-eyebrow font-semibold uppercase text-ink-3">
        <Icon aria-hidden="true" className="h-3.5 w-3.5 text-brand-300" />
        {label}
      </div>
      <p className="data mt-2.5 truncate text-[15px] font-medium text-ink" title={value}>
        {value}
      </p>
      <div className="mt-3 border-t border-line/70 pt-1.5">
        <dl>{children}</dl>
      </div>
    </article>
  );
}

export function IOCSummary({ ioc = {} }) {
  const age = ioc.domain_age_days;
  const abuse = ioc.abuse_score;
  const vtPos = ioc.vt_positives;
  const vtTotal = ioc.vt_total;

  const hasAbuse = abuse != null;
  const hasVt = vtPos != null && vtTotal != null;

  return (
    <Panel title="IOC Detayları" icon={Fingerprint} meta="Domain · IP · URL">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card icon={Globe} label="Domain & WHOIS" value={ioc.domain || '—'}>
          <Field label="Registrar" value={ioc.registrar || 'Bilinmiyor'} />
          <Field label="Kayıt tarihi" value={ioc.domain_registration_date || 'Bilinmiyor'} />
          <Field
            label="Domain yaşı"
            value={formatAge(age)}
            tone={age != null && age < 30 ? 'bad' : 'default'}
          />
        </Card>

        <Card icon={Server} label="IP Adresi & İtibar" value={ioc.ip_address || '—'}>
          <Field
            label="AbuseIPDB skoru"
            value={hasAbuse ? `%${abuse}` : statusLabel(ioc.abuse_status)}
            tone={hasAbuse ? (abuse >= 50 ? 'bad' : 'good') : 'default'}
          />
          <Field
            label="Rapor sayısı"
            value={ioc.ip_reports_count != null ? ioc.ip_reports_count : '—'}
          />
        </Card>

        <Card icon={ShieldCheck} label="VirusTotal & URL" value={ioc.url || '—'}>
          <Field
            label="Zararlı tespiti"
            value={hasVt ? `${vtPos} / ${vtTotal}` : statusLabel(ioc.vt_status)}
            tone={hasVt ? (vtPos > 0 ? 'bad' : 'good') : 'default'}
          />
          <Field label="HTTPS" value={ioc.has_https ? 'Var' : 'Yok'} tone={ioc.has_https ? 'good' : 'bad'} />
        </Card>
      </div>
    </Panel>
  );
}
