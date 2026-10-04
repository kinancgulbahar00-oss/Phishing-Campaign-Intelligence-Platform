import React from 'react';
import { GitBranch } from 'lucide-react';
import { Panel } from './ui/Panel';

export function RelatedDomains({ domains = [] }) {
  return (
    <Panel
      title="Benzer & İlişkili Domainler"
      icon={GitBranch}
      meta="Typosquatting"
      className="h-full"
      bodyClassName="pt-4"
    >
      {domains.length === 0 ? (
        <p className="text-sm text-ink-3">Benzer domain bulunamadı.</p>
      ) : (
        <ul className="space-y-2.5">
          {domains.map((item, i) => {
            const pct = Math.max(0, Math.min(100, Number(item.similarity) || 0));
            return (
              <li
                key={i}
                className="rounded-[10px] border border-line bg-surface-2 px-3.5 py-3 transition-colors duration-200 hover:border-line-strong hover:bg-surface-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="data truncate text-[13px] text-ink" title={item.domain}>
                    {item.domain}
                  </span>
                  <span className="data shrink-0 text-xs font-medium text-ink-2">%{pct}</span>
                </div>
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-300 transition-[width] duration-500 ease-out"
                    style={{ width: `${pct}%` }}
                    role="meter"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${item.domain} benzerlik oranı`}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
