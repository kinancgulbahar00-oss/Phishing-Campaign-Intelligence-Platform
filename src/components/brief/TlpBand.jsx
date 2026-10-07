import React from 'react';
import { TLP } from '../../lib/tlp';

export function TlpBand({ tlp, reference, stamp, position = 'top' }) {
  const t = TLP[tlp] || TLP.amber;
  const top = position === 'top';

  return (
    <div className={`tlp-band flex flex-wrap items-center gap-x-5 gap-y-1 bg-black px-5 py-2 sm:px-8 ${top ? 'rounded-t' : 'rounded-b'}`}>
      <span className={`data text-sm font-semibold tracking-[0.02em] transition-colors duration-200 ${t.color}`}>{t.label}</span>
      {top ? (
        <>
          <span className="text-xs font-medium text-white/75">Mihenk · Tehdit brifingi</span>
          <span className="data ml-auto text-xs text-white/75">
            {reference} · {stamp}
          </span>
        </>
      ) : (
        <>
          <span className="min-w-0 flex-1 text-xs text-white/75">{t.rule}</span>
          <span className="data hidden text-xs text-white/75 sm:inline">{reference}</span>
        </>
      )}
    </div>
  );
}
