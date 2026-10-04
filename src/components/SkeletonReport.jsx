import React from 'react';

const Bar = ({ className = '' }) => (
  <div className={`relative overflow-hidden rounded bg-surface-3 ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
  </div>
);

export function SkeletonReport() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="panel flex h-[340px] flex-col items-center justify-center gap-5">
          <Bar className="h-3 w-24" />
          <div className="h-[152px] w-[152px] rounded-full border-8 border-surface-3" />
          <Bar className="h-6 w-24 rounded-full" />
        </div>
        <div className="panel h-[340px] p-6 lg:col-span-2">
          <Bar className="h-3 w-40" />
          <div className="mt-6 space-y-5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Bar className="h-3.5 w-1/3" />
                <Bar className="h-3 w-4/5" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="panel h-[200px] p-6">
        <Bar className="h-3 w-28" />
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Bar key={i} className="h-[104px]" />
          ))}
        </div>
      </div>
    </div>
  );
}
