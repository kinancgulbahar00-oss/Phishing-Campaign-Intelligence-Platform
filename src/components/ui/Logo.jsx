import React from 'react';

export function Logo({ className = 'h-9 w-9' }) {
  return (
    <svg viewBox="0 0 40 40" className={className} role="img" aria-label="CTI Phishing Platform logosu">
      <defs>
        <linearGradient id="logoGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E9D08A" />
          <stop offset="100%" stopColor="#B8912F" />
        </linearGradient>
      </defs>
      <rect x="0.75" y="0.75" width="38.5" height="38.5" rx="10" fill="#0F1726" stroke="#253453" strokeWidth="1.5" />
      <path
        d="M20 8.5l9 3.4v8.2c0 5.9-3.9 9.9-9 11.4-5.1-1.5-9-5.5-9-11.4v-8.2l9-3.4z"
        fill="none"
        stroke="url(#logoGold)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M20 15.2v5.6M20 24.2v0.9" stroke="url(#logoGold)" strokeWidth="2.1" strokeLinecap="round" />
    </svg>
  );
}
