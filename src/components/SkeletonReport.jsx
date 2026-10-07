import React from 'react';

const Bar = ({ className = '' }) => (
  <div className={`relative overflow-hidden rounded-sm bg-line/70 ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-sheet/70 to-transparent" />
  </div>
);

export function SkeletonReport() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_272px]" aria-hidden="true">
      <div className="sheet overflow-hidden">
        <div className="h-9 bg-black" />
        <div className="space-y-4 px-5 py-6 sm:px-8">
          <Bar className="h-3 w-28" />
          <Bar className="h-4 w-2/3" />
          <Bar className="mt-6 h-7 w-4/5" />
          <Bar className="h-7 w-1/2" />
          <Bar className="mt-6 h-2.5 w-full" />
        </div>
        <div className="space-y-5 border-t border-line px-5 py-6 sm:px-8">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <Bar className="h-3.5 w-1/3" />
              <Bar className="h-3 w-4/5" />
            </div>
          ))}
        </div>
      </div>
      <div className="sheet hidden h-fit space-y-3 p-5 lg:block">
        <Bar className="h-3 w-24" />
        <Bar className="h-9 w-full" />
        <Bar className="mt-4 h-9 w-full" />
        <Bar className="h-9 w-full" />
      </div>
    </div>
  );
}
