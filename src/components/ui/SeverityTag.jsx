import React from 'react';
import { AlertOctagon, AlertTriangle, AlertCircle, CheckCircle2, MinusCircle } from 'lucide-react';
import { severityKey, SEVERITY } from '../../lib/verdict';

// Renk tek basina anlam tasimaz: her derecenin kendi ikon bicimi ve etiketi var.
export const SHAPES = {
  critical: AlertOctagon,
  high: AlertTriangle,
  medium: AlertCircle,
  low: CheckCircle2,
  unknown: MinusCircle,
};

export function SeverityTag({ severity, label, size = 'sm' }) {
  const key = severityKey(severity);
  const s = SEVERITY[key];
  const Icon = SHAPES[key];
  const big = size === 'lg';

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-sm font-semibold ${s.text} ${s.soft} ${
        big ? 'px-2.5 py-1 text-sm' : 'px-1.5 py-0.5 text-xs'
      }`}
    >
      <Icon aria-hidden="true" className={big ? 'h-4 w-4' : 'h-3.5 w-3.5'} strokeWidth={2.25} />
      {label || s.label}
    </span>
  );
}
