import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { SearchBar } from '../components/SearchBar';
import { EmptyState } from '../components/EmptyState';
import { SkeletonReport } from '../components/SkeletonReport';
import { Brief } from '../components/brief/Brief';
import { AnalystRail } from '../components/brief/AnalystRail';

export function AnalysisPage({ state, onSearch, onRetry, tlp, onTlpChange }) {
  const { data, verdict, query, reference, stamp, loading, error } = state;

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-8 lg:py-10">
      <header className="no-print mb-6">
        <h1 className="text-2xl font-semibold tracking-[-0.01em]">Gösterge analizi</h1>
        <p className="mt-1 max-w-[70ch] text-sm text-ink-2">
          Şüpheli bir URL veya alan adı girin; Mihenk açık kaynak istihbarat sağlayıcılarını sorgular ve gerekçeli bir tehdit
          brifingi üretir.
        </p>
      </header>

      <SearchBar onSearch={onSearch} loading={loading} value={query} />

      {error && (
        <div
          role="alert"
          className="no-print mt-5 flex flex-wrap items-start gap-3 rounded border border-risk-critical/30 bg-risk-critical/[0.06] px-4 py-3 text-sm text-risk-critical"
        >
          <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1">{error}</span>
          {query && (
            <button type="button" onClick={onRetry} className="font-semibold underline underline-offset-2">
              Tekrar dene
            </button>
          )}
        </div>
      )}

      <div className="mt-8" aria-live="polite" aria-busy={loading}>
        {loading && <SkeletonReport />}
        {!loading && !data && !error && <EmptyState />}
        {!loading && data && (
          <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_272px]">
            <Brief data={data} verdict={verdict} tlp={tlp} reference={reference} stamp={stamp} />
            <AnalystRail
              data={data}
              verdict={verdict}
              tlp={tlp}
              onTlpChange={onTlpChange}
              reference={reference}
              stamp={stamp}
            />
          </div>
        )}
      </div>
    </div>
  );
}
