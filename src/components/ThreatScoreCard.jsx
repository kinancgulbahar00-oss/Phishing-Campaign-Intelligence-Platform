import React, { useEffect, useState } from 'react';
import { levelFromScore } from './ui/severity';

const STROKE = {
  critical: '#F04438',
  high: '#FF7A45',
  medium: '#FDB022',
  low: '#12B76A',
};

const R = 58;
const CIRC = 2 * Math.PI * R;

export function ThreatScoreCard({ score = 0, level }) {
  const value = Math.max(0, Math.min(100, Number(score) || 0));
  const sev = levelFromScore(value);
  const key = Object.keys(STROKE).find((k) => sev.text.includes(k)) || 'low';
  const color = STROKE[key];

  const [drawn, setDrawn] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setDrawn(value));
    return () => cancelAnimationFrame(id);
  }, [value]);

  return (
    <section className="panel flex h-full flex-col items-center justify-center px-6 py-8 text-center">
      <h2 className="panel-title">Tehdit Skoru</h2>

      <div className="relative my-6 flex h-[152px] w-[152px] items-center justify-center">
        <svg viewBox="0 0 140 140" className="absolute inset-0 h-full w-full -rotate-90">
          <circle cx="70" cy="70" r={R} fill="none" stroke="#1B2740" strokeWidth="8" />
          <circle
            cx="70"
            cy="70"
            r={R}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC - (CIRC * drawn) / 100}
            style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)' }}
          />
        </svg>
        <div className="flex flex-col items-center leading-none">
          <span className="data text-[44px] font-bold text-ink">{value}</span>
          <span className="data mt-1.5 text-xs text-ink-3">/ 100</span>
        </div>
      </div>

      <div
        className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-eyebrow font-bold uppercase"
        style={{ color, borderColor: `${color}55`, backgroundColor: `${color}14` }}
      >
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
        {level || sev.label}
      </div>

      <p className="mt-5 max-w-[26ch] text-sm leading-relaxed text-ink-3">
        Skor; domain yaşı, IP itibarı, sertifika ve içerik sinyallerinin ağırlıklı toplamıdır.
      </p>
    </section>
  );
}
