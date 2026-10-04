import React from 'react';
import { severityOf } from './severity';

export function SeverityChip({ severity, children, className = '' }) {
  const s = severityOf(severity);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${s.ring} ${s.tint} ${s.text} ${className}`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {children || s.label}
    </span>
  );
}
