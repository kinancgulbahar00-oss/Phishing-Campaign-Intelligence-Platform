import React, { useEffect, useState } from 'react';
import { Printer, Copy, Check, Ban, ShieldCheck, Loader2 } from 'lucide-react';
import { TLP, TLP_ORDER } from '../../lib/tlp';
import { addListItem } from '../../api/client';
import { coverageOf, evidenceRows } from './evidence';
import { sortFindings, formatPoints } from './Brief';
import { severityOf } from '../../lib/verdict';
import { ROUTES } from '../../lib/useHashRoute';

function RailBlock({ title, children }) {
  return (
    <section className="border-t border-line py-5 first:border-t-0 first:pt-0">
      <h2 className="mb-3 text-xs font-semibold text-ink-2">{title}</h2>
      {children}
    </section>
  );
}

export function buildSummary({ data, verdict, tlp, reference, stamp }) {
  const t = TLP[tlp];
  const lines = [
    `[${t.label}] Mihenk tehdit brifingi ${reference}`,
    `Tarih: ${stamp}`,
    `Gösterge: ${data.url}`,
    `Karar: ${verdict.word}`,
    `Skor: ${data.risk_score}/100`,
    ...(data.ioc_details?.target_brand
      ? [`Taklit edilen kurum: ${data.ioc_details.target_brand}${data.ioc_details.target_sector ? ` (${data.ioc_details.target_sector})` : ''}`]
      : []),
    '',
    'Bulgular:',
    ...sortFindings(data.reasons).flatMap((f, i) => [
      `  1.${i + 1} [${severityOf(f.severity).label}] ${f.rule_name}${
        typeof f.contribution === 'number' ? ` (${formatPoints(f.contribution)} puan)` : ''
      }`,
      `       ${f.description}`,
    ]),
    '',
    'Kanıt:',
    ...evidenceRows(data.ioc_details, verdict.listMatch).map(
      (r) => `  ${r.source} · ${r.label}: ${r.value ?? r.missing}${r.flag ? ` (${r.flag.text})` : ''}`
    ),
    '',
    t.rule,
  ];
  return lines.join('\n');
}

export function AnalystRail({ data, verdict, tlp, onTlpChange, reference, stamp, onRuleAdded }) {
  const [copied, setCopied] = useState(false);
  const [rule, setRule] = useState({ state: 'idle', list: null, message: '' });
  const domain = data.ioc_details?.domain;
  const coverage = coverageOf(data.ioc_details, verdict.listMatch);
  const answered = coverage.filter((c) => c.ok).length;

  useEffect(() => {
    setRule({ state: 'idle', list: null, message: '' });
  }, [data]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(buildSummary({ data, verdict, tlp, reference, stamp }));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const addRule = async (list) => {
    setRule({ state: 'busy', list, message: '' });
    try {
      await addListItem({
        list_type: list,
        entry_type: 'domain',
        pattern: domain,
        description: `${reference} brifinginden eklendi`,
      });
      setRule({
        state: 'done',
        list,
        message: list === 'blacklist' ? 'Engel listesine eklendi.' : 'İzin listesine eklendi.',
      });
      onRuleAdded?.();
    } catch (err) {
      setRule({ state: 'error', list, message: err.message || 'Kural eklenemedi.' });
    }
  };

  return (
    <aside className="no-print sheet h-fit p-5 lg:sticky lg:top-6" aria-label="Analist işlemleri">
      <RailBlock title="Dağıtım işareti">
        <div role="radiogroup" aria-label="TLP işareti" className="grid grid-cols-4 gap-1 rounded bg-black p-1">
          {TLP_ORDER.map((key) => {
            const t = TLP[key];
            const active = tlp === key;
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onTlpChange(key)}
                title={t.label}
                className={`data h-7 rounded-sm text-2xs font-semibold transition-colors duration-150 focus-visible:outline-white ${
                  active ? `bg-night-3 ${t.color}` : 'text-white/45 hover:bg-night-2 hover:text-white/80'
                }`}
              >
                {key.toUpperCase()}
              </button>
            );
          })}
        </div>
        <p className="mt-2.5 text-xs leading-relaxed text-ink-3">{TLP[tlp].rule}</p>
      </RailBlock>

      <RailBlock title="Brifingi paylaş">
        <div className="grid gap-2">
          <button type="button" onClick={() => window.print()} className="btn-secondary w-full justify-start">
            <Printer aria-hidden="true" className="h-4 w-4 text-ink-2" />
            Yazdır veya PDF kaydet
          </button>
          <button type="button" onClick={copy} className="btn-secondary w-full justify-start" aria-live="polite">
            {copied ? (
              <Check aria-hidden="true" className="h-4 w-4 text-risk-low" />
            ) : (
              <Copy aria-hidden="true" className="h-4 w-4 text-ink-2" />
            )}
            {copied ? 'Özet panoya kopyalandı' : 'Bilet için özeti kopyala'}
          </button>
        </div>
      </RailBlock>

      {domain && !verdict.listMatch && (
        <RailBlock title="Analist kuralı">
          <p className="data mb-3 truncate text-xs text-ink-2" title={domain}>
            {domain}
          </p>
          {rule.state === 'done' ? (
            <div role="status" className="rounded bg-petrol-50 px-3 py-2.5 text-sm text-petrol-800">
              {rule.message}{' '}
              <a href={ROUTES.rules} className="font-semibold underline">
                Kuralları gör
              </a>
            </div>
          ) : (
            <div className="grid gap-2">
              <button
                type="button"
                disabled={rule.state === 'busy'}
                onClick={() => addRule('blacklist')}
                className="btn-secondary w-full justify-start"
              >
                {rule.state === 'busy' && rule.list === 'blacklist' ? (
                  <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                ) : (
                  <Ban aria-hidden="true" className="h-4 w-4 text-risk-critical" />
                )}
                Engel listesine ekle
              </button>
              <button
                type="button"
                disabled={rule.state === 'busy'}
                onClick={() => addRule('whitelist')}
                className="btn-secondary w-full justify-start"
              >
                {rule.state === 'busy' && rule.list === 'whitelist' ? (
                  <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck aria-hidden="true" className="h-4 w-4 text-risk-low" />
                )}
                İzin listesine ekle
              </button>
              {rule.state === 'error' && (
                <p role="alert" className="text-xs text-risk-critical">
                  {rule.message}
                </p>
              )}
            </div>
          )}
        </RailBlock>
      )}

      <RailBlock title={`Kaynak kapsamı · ${answered}/${coverage.length}`}>
        <ul className="space-y-1.5 text-sm">
          {coverage.map((c) => (
            <li key={c.name} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-ink-2">
                <span
                  aria-hidden="true"
                  className={`h-1.5 w-1.5 rounded-full ${c.ok ? 'bg-risk-low' : 'border border-ink-3 bg-transparent'}`}
                />
                {c.name}
              </span>
              <span className={`text-xs ${c.ok ? 'text-ink-2' : 'text-ink-3'}`}>{c.note}</span>
            </li>
          ))}
        </ul>
      </RailBlock>
    </aside>
  );
}
