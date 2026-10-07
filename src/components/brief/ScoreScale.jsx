import React, { useEffect, useState } from 'react';
import { BANDS, SEVERITY } from '../../lib/verdict';

// Halka gosterge yerine bantli dogrusal olcek: skor, hangi araliga dustugunu ve
// esiklere ne kadar yakin oldugunu tek bakista gosterir.
export function ScoreScale({ score, bandKey }) {
  const value = Math.max(0, Math.min(100, Number(score) || 0));
  const [pos, setPos] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setPos(value));
    return () => cancelAnimationFrame(id);
  }, [value]);

  return (
    <figure className="w-full" aria-label={`Tehdit skoru 100 üzerinden ${value}`}>
      <div className="relative pt-7">
        <div
          className="absolute top-0 -translate-x-1/2 transition-[left] duration-700 ease-out"
          style={{ left: `${pos}%` }}
          aria-hidden="true"
        >
          <span className="data block rounded-sm bg-ink px-1.5 py-0.5 text-xs font-semibold text-sheet">{value}</span>
          <span className="mx-auto block h-2 w-px bg-ink" />
        </div>

        <div className="flex h-2.5 gap-[2px]" aria-hidden="true">
          {BANDS.map((b) => {
            const active = b.key === bandKey;
            const width = b.to - b.from + (b.key === 'critical' ? 0 : 1);
            return (
              <div
                key={b.key}
                style={{ flexBasis: `${width}%` }}
                className={`h-full first:rounded-l-sm last:rounded-r-sm ${SEVERITY[b.key].bg} ${active ? '' : 'opacity-[0.16]'}`}
              />
            );
          })}
        </div>

        <div className="mt-1.5 flex text-2xs" aria-hidden="true">
          {BANDS.map((b) => {
            const width = b.to - b.from + (b.key === 'critical' ? 0 : 1);
            const active = b.key === bandKey;
            return (
              <div key={b.key} style={{ flexBasis: `${width}%` }} className="min-w-0">
                <span className={`data ${active ? 'text-ink' : 'text-ink-3'}`}>{b.from}</span>
                <span className={`ml-1.5 hidden sm:inline ${active ? `font-semibold ${SEVERITY[b.key].text}` : 'text-ink-3'}`}>
                  {b.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </figure>
  );
}
