import React from 'react';
import { ListChecks } from 'lucide-react';
import { Panel } from './ui/Panel';
import { SeverityChip } from './ui/SeverityChip';
import { severityOf } from './ui/severity';

export function ExplainabilityList({ items = [] }) {
  const sorted = [...items].sort((a, b) => severityOf(a.severity).rank - severityOf(b.severity).rank);

  return (
    <Panel
      title="Risk Analizi ve Gerekçeler"
      icon={ListChecks}
      meta={`${items.length} bulgu`}
      className="h-full"
      bodyClassName="pt-4"
    >
      {sorted.length === 0 ? (
        <p className="text-sm text-ink-3">Herhangi bir bulgu tespit edilmedi.</p>
      ) : (
        <ul className="divide-y divide-line/70">
          {sorted.map((item, idx) => {
            const s = severityOf(item.severity);
            return (
              <li key={idx} className="group relative flex gap-4 py-3.5 first:pt-0 last:pb-0">
                <span aria-hidden="true" className={`w-[3px] shrink-0 self-stretch rounded-full ${s.dot} opacity-80`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <h3 className="text-[15px] font-semibold text-ink">{item.rule_name}</h3>
                    <SeverityChip severity={item.severity} />
                  </div>
                  <p className="mt-1 max-w-[72ch] text-sm leading-relaxed text-ink-2">{item.description}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
