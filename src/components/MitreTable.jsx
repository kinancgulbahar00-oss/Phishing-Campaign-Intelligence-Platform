import React from 'react';
import { Crosshair, ExternalLink } from 'lucide-react';
import { Panel } from './ui/Panel';

const attackUrl = (id) => `https://attack.mitre.org/techniques/${String(id).replace('.', '/')}/`;

export function MitreTable({ techniques = [] }) {
  return (
    <Panel
      title="MITRE ATT&CK Eşleşmeleri"
      icon={Crosshair}
      meta={`${techniques.length} teknik`}
      className="h-full"
      bodyClassName="p-0 sm:p-0"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-sm">
          <caption className="sr-only">Tespit edilen MITRE ATT&CK taktik ve teknikleri</caption>
          <thead>
            <tr className="border-b border-line bg-surface-2 text-eyebrow uppercase text-ink-3">
              <th scope="col" className="px-5 py-2.5 font-semibold sm:px-6">ID</th>
              <th scope="col" className="px-5 py-2.5 font-semibold">Taktik</th>
              <th scope="col" className="px-5 py-2.5 font-semibold sm:px-6">Teknik</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/70">
            {techniques.length === 0 ? (
              <tr>
                <td colSpan="3" className="px-6 py-6 text-center text-sm text-ink-3">
                  Taktik eşleşmesi bulunamadı.
                </td>
              </tr>
            ) : (
              techniques.map((t, i) => (
                <tr key={i} className="transition-colors duration-150 hover:bg-surface-2">
                  <td className="whitespace-nowrap px-5 py-3 sm:px-6">
                    <a
                      href={attackUrl(t.id)}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="data group inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-medium text-brand-300 transition-colors duration-150 hover:text-brand-200"
                    >
                      {t.id}
                      <ExternalLink aria-hidden="true" className="h-3 w-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
                      <span className="sr-only">(MITRE ATT&CK sayfasında aç)</span>
                    </a>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-[13px] text-ink-2">{t.tactic}</td>
                  <td className="px-5 py-3 text-[13px] text-ink sm:px-6">{t.technique}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
