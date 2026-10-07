import React from 'react';
import logoUrl from '../../../docs/logo.jpg';

export function LogoMark({ className = 'h-8 w-8' }) {
  return (
    <img
      src={logoUrl}
      alt=""
      aria-hidden="true"
      width="32"
      height="32"
      className={`shrink-0 rounded-[5px] object-cover ring-1 ring-night-3 ${className}`}
    />
  );
}

export function Wordmark({ inverse = true }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark />
      <div className="leading-none">
        <p className={`font-serif text-[1.3125rem] font-semibold tracking-[-0.01em] ${inverse ? 'text-white' : 'text-ink'}`}>
          Mihenk
        </p>
        <p className={`mt-1 text-2xs ${inverse ? 'text-night-text' : 'text-ink-3'}`}>Yıldız Siber Tehdit İstihbaratı</p>
      </div>
    </div>
  );
}
