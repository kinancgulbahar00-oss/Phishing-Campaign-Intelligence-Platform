import React from 'react';
import { TlpBand } from './TlpBand';
import { ScoreScale } from './ScoreScale';
import { evidenceRows } from './evidence';
import { SeverityTag, SHAPES } from '../ui/SeverityTag';
import { severityOf, SEVERITY } from '../../lib/verdict';

function Section({ n, title, meta, children }) {
  return (
    <section className="break-inside-avoid-page border-t border-line px-5 py-6 sm:px-8" aria-labelledby={`sec-${n}`}>
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 id={`sec-${n}`} className="doc-h flex items-baseline gap-3">
          <span className="data text-sm font-medium text-ink-3">{n}</span>
          {title}
        </h2>
        {meta && <span className="shrink-0 text-right text-xs text-ink-3">{meta}</span>}
      </div>
      {children}
    </section>
  );
}

// Katki bilgisi varsa skora en cok etki edenden aza; yoksa onem derecesine gore
export function sortFindings(reasons = []) {
  if (reasons.some((r) => typeof r.contribution === 'number')) {
    return [...reasons].sort((a, b) => Math.abs(b.contribution ?? 0) - Math.abs(a.contribution ?? 0));
  }
  return [...reasons].sort((a, b) => severityOf(a.severity).rank - severityOf(b.severity).rank);
}

export const formatPoints = (n) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0');

function Points({ value }) {
  if (typeof value !== 'number') return <span />;
  const tone = value < 0 ? 'text-risk-low' : value === 0 ? 'text-ink-3' : 'text-ink';
  return (
    <span className={`data pt-px text-right text-sm font-semibold ${tone}`}>
      {formatPoints(value)}
      <span className="sr-only"> puan</span>
    </span>
  );
}

function Value({ row }) {
  if (row.value == null) return <span className="text-ink-3">{row.missing}</span>;
  return <span className={row.mono ? 'data text-[0.8125rem] text-ink' : 'text-ink'}>{row.value}</span>;
}

function EvidenceTable({ rows }) {
  return (
    <>
      {/* Dar ekranda her gozlem kendi blogunda: tablo kirpilmaz */}
      <dl className="divide-y divide-line sm:hidden">
        {rows.map((r) => (
          <div key={r.source + r.label} className="py-2.5">
            <dt className="text-xs text-ink-3">
              <span className="font-medium">{r.source}</span> · {r.label}
            </dt>
            <dd className="mt-0.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm [overflow-wrap:anywhere]">
              <Value row={r} />
              {r.flag && <SeverityTag severity={r.flag.severity} label={r.flag.text} />}
            </dd>
          </div>
        ))}
      </dl>

      <table className="hidden w-full text-left text-sm sm:table">
        <caption className="sr-only">Gösterge kanıtları ve kaynakları</caption>
        <thead>
          <tr className="border-b border-line-strong text-xs text-ink-3">
            <th scope="col" className="w-[7.5rem] py-2 pr-3 font-medium">Kaynak</th>
            <th scope="col" className="py-2 pr-3 font-medium">Gözlem</th>
            <th scope="col" className="py-2 pr-3 font-medium">Değer</th>
            <th scope="col" className="py-2 text-right font-medium">İşaret</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r) => (
            <tr key={r.source + r.label}>
              <td className="py-2.5 pr-3 text-xs font-medium text-ink-3">{r.source}</td>
              <td className="py-2.5 pr-3 text-ink-2">{r.label}</td>
              <td className="py-2.5 pr-3 [overflow-wrap:anywhere]">
                <Value row={r} />
              </td>
              <td className="py-2.5 text-right">{r.flag && <SeverityTag severity={r.flag.severity} label={r.flag.text} />}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export function Brief({ data, verdict, tlp, reference, stamp }) {
  const ioc = data.ioc_details || {};
  const findings = sortFindings(data.reasons);
  const rows = evidenceRows(ioc, verdict.listMatch);
  const related = data.related_domains || [];
  const subject = ioc.domain || data.url;
  const score = Number(data.risk_score) || 0;
  const VerdictIcon = SHAPES[verdict.key];
  const hasPoints = findings.some((f) => typeof f.contribution === 'number');

  return (
    <article className="sheet print-full animate-rise" aria-label={`Tehdit brifingi ${reference}`}>
      {/* thead/tfoot yazdirmada her sayfanin basinda ve sonunda tekrarlanir: TLP isareti her sayfada kalir */}
      <table className="w-full table-fixed border-collapse">
        <thead>
          <tr>
            <td className="p-0">
              <TlpBand tlp={tlp} reference={reference} stamp={stamp} />
            </td>
          </tr>
        </thead>
        <tfoot>
          <tr>
            <td className="p-0">
              <TlpBand tlp={tlp} reference={reference} position="bottom" />
            </td>
          </tr>
        </tfoot>
        <tbody>
          <tr>
            <td className="p-0 align-top">
              <header className="px-5 pb-7 pt-6 sm:px-8">
                <p className="label">İncelenen gösterge</p>
                <p className="data mt-1 break-all text-base font-medium text-ink">{data.url}</p>

                <p className="mt-5 max-w-[46ch] font-serif text-2xl leading-[1.3] text-ink sm:text-3xl sm:leading-[1.25]">
                  <span className="font-semibold">{subject}</span> {verdict.sentence}.
                </p>

                {ioc.target_brand && (
                  <p className="mt-3 flex flex-wrap items-baseline gap-x-2 text-sm">
                    <span className="label">Taklit edilen kurum</span>
                    <span className="font-semibold text-ink">{ioc.target_brand}</span>
                    {ioc.target_sector && <span className="text-ink-3">· {ioc.target_sector}</span>}
                  </p>
                )}

                <div className="mt-7 grid items-end gap-x-10 gap-y-5 sm:grid-cols-[auto_minmax(0,1fr)]">
                  <div>
                    <p className="label">Karar</p>
                    <p className={`mt-1 flex items-center gap-2 text-[1.75rem] font-bold leading-none tracking-[-0.015em] ${SEVERITY[verdict.key].text}`}>
                      <VerdictIcon aria-hidden="true" className="h-6 w-6" strokeWidth={2.5} />
                      {verdict.word}
                      <span className="data ml-2 text-sm font-normal tracking-normal text-ink-2">
                        <span className="text-lg font-semibold text-ink">{score}</span>/100
                      </span>
                    </p>
                  </div>
                  <ScoreScale score={score} bandKey={verdict.key} />
                </div>
              </header>

              <Section n="1" title="Bulgular" meta={hasPoints ? 'Skora katkı' : `${findings.length} kural tetiklendi`}>
                <ol className="divide-y divide-line">
                  {findings.map((f, i) => (
                    <li key={i} className="grid grid-cols-[2.25rem_minmax(0,1fr)_auto] gap-x-2 py-3.5 first:pt-0 last:pb-0">
                      <span className="data pt-px text-sm text-ink-3">1.{i + 1}</span>
                      <div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <h3 className="text-base font-semibold">{f.rule_name}</h3>
                          <SeverityTag severity={f.severity} />
                        </div>
                        <p className="mt-1 max-w-[70ch] text-sm leading-relaxed text-ink-2">{f.description}</p>
                      </div>
                      {hasPoints && <Points value={f.contribution} />}
                    </li>
                  ))}
                </ol>
              </Section>

              <Section n="2" title="Kanıt" meta="WHOIS · DNS · TLS · Sayfa · İtibar">
                <EvidenceTable rows={rows} />
              </Section>

              <Section n="3" title="Benzer alan adları" meta={related.length ? 'Ad benzerliği' : null}>
                {related.length === 0 ? (
                  <p className="text-sm text-ink-3">Bu gösterge için benzer alan adı raporlanmadı.</p>
                ) : (
                  <>
                    <p className="mb-3 max-w-[70ch] text-xs leading-relaxed text-ink-3">
                      Liste hem taklit adaylarını hem de taklit edilen gerçek alan adlarını içerebilir. Kural eklemeden önce
                      sahipliği doğrulayın.
                    </p>
                    <ul className="divide-y divide-line">
                      {related.map((d, i) => {
                        const pct = Math.max(0, Math.min(100, Number(d.similarity) || 0));
                        return (
                          <li key={d.domain + i} className="grid grid-cols-[minmax(0,1fr)_5rem_2.75rem] items-center gap-3 py-2.5 sm:grid-cols-[minmax(0,1fr)_8rem_3rem] sm:gap-4">
                            <span className="data truncate text-[0.8125rem] text-ink" title={d.domain}>
                              {d.domain}
                            </span>
                            <span className="h-1.5 overflow-hidden rounded-sm bg-line" aria-hidden="true">
                              <span className="block h-full bg-petrol-700" style={{ width: `${pct}%` }} />
                            </span>
                            <span className="data text-right text-xs text-ink-2">%{pct}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}
              </Section>

              <footer className="border-t border-line px-5 py-4 text-xs leading-relaxed text-ink-3 sm:px-8">
                Bu brifing Mihenk tarafından otomatik üretilmiştir. Bulgu puanlarının toplamı skoru verir; karar dili skor
                bandından türetilir ve analist değerlendirmesinin yerini tutmaz.
              </footer>
            </td>
          </tr>
        </tbody>
      </table>
    </article>
  );
}
