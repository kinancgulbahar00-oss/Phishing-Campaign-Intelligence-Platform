import React, { useState } from 'react';
import { AlertTriangle, Clock3, FileDown, ShieldCheck } from 'lucide-react';
import { SearchBar } from './components/SearchBar';
import { ThreatScoreCard } from './components/ThreatScoreCard';
import { IOCSummary } from './components/IOCSummary';
import { ExplainabilityList } from './components/ExplainabilityList';
import { EmptyState } from './components/EmptyState';
import { SkeletonReport } from './components/SkeletonReport';
import { ListManagementModal } from './components/ListManagementModal';
import { Logo } from './components/ui/Logo';
import { analyzeUrl } from './api/client';

export default function App() {
  const [data, setData] = useState(null);
  const [query, setQuery] = useState('');
  const [stamp, setStamp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isListModalOpen, setIsListModalOpen] = useState(false);

  const handleSearch = async (url) => {
    setLoading(true);
    setError('');
    setQuery(url);
    try {
      const result = await analyzeUrl(url);
      setData(result);
      setStamp(new Date().toLocaleString('tr-TR'));
    } catch (err) {
      setData(null);
      setError(err.message || 'Bağlantı hatası oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#report"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-brand-400 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-canvas"
      >
        İçeriğe geç
      </a>

      <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-4 px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <Logo />
            <div className="leading-tight">
              <p className="text-eyebrow font-semibold uppercase text-brand-300">Threat Intelligence</p>
              <h1 className="text-[15px] font-semibold tracking-tight text-ink">CTI Phishing Platform</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsListModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs font-semibold text-ink hover:border-brand-400 hover:text-brand-300 transition-colors"
            >
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Liste Yönetimi</span>
            </button>
            <span className="data rounded-full border border-line bg-surface px-3 py-1.5 text-[11px] text-ink-3">
              v1.0
            </span>
          </div>
        </div>
        <div aria-hidden="true" className="h-px w-full bg-hairline-t" />
      </header>

      <main id="report" className="mx-auto w-full max-w-[1240px] flex-1 px-5 py-8 sm:px-8 sm:py-10">
        <section className="mb-8">
          <SearchBar onSearch={handleSearch} loading={loading} />

          {error && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-3 rounded-panel border border-risk-critical/35 bg-risk-critical/10 px-4 py-3 text-sm text-risk-critical"
            >
              <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </section>

        <div aria-live="polite" aria-busy={loading}>
          {loading && <SkeletonReport />}

          {!loading && !data && <EmptyState />}

          {!loading && data && (
            <div className="animate-fade-up space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-panel border border-line bg-surface px-5 py-3">
                <div className="min-w-0">
                  <p className="text-eyebrow font-semibold uppercase text-ink-3">Analiz edilen gösterge</p>
                  <p className="data mt-1 truncate text-sm text-ink" title={query}>
                    {query}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center gap-1.5 text-xs text-ink-3">
                    <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
                    {stamp}
                  </span>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-[10px] border border-line bg-surface-2 px-3.5 py-2 text-xs font-medium text-ink-2 transition-colors duration-200 hover:border-line-strong hover:text-ink"
                  >
                    <FileDown aria-hidden="true" className="h-3.5 w-3.5" />
                    Raporu dışa aktar
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="lg:col-span-1">
                  <ThreatScoreCard score={data.risk_score} level={data.risk_level} />
                </div>
                <div className="lg:col-span-2">
                  <ExplainabilityList items={data.reasons} />
                </div>
              </div>

              <IOCSummary ioc={data.ioc_details} />
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-2 px-5 py-6 text-xs text-ink-3 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>CTI Phishing Platform — açık kaynak istihbarat sağlayıcılarıyla beslenir.</p>
          <p className="data">Veri kaynakları: WHOIS · AbuseIPDB · VirusTotal</p>
        </div>
      </footer>

      <ListManagementModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
      />
    </div>
  );
}
