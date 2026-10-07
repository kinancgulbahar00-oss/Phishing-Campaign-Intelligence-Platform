import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './components/layout/Sidebar';
import { Wordmark } from './components/ui/Logo';
import { AnalysisPage } from './pages/AnalysisPage';
import { RulesPage } from './pages/RulesPage';
import { CatalogPage } from './pages/CatalogPage';
import { analyzeUrl } from './api/client';
import { useHashRoute, ROUTES } from './lib/useHashRoute';
import { verdictOf, referenceOf, formatStamp } from './lib/verdict';
import { loadRecent, pushRecent, clearRecent, loadTlp, saveTlp } from './lib/storage';
import { useTheme } from './lib/theme';

const EMPTY = { data: null, verdict: null, query: null, reference: '', stamp: '', loading: false, error: '' };

export default function App() {
  const route = useHashRoute();
  const [analysis, setAnalysis] = useState(EMPTY);
  const [recent, setRecent] = useState(loadRecent);
  const [tlp, setTlp] = useState(loadTlp);
  const [navOpen, setNavOpen] = useState(false);
  const [theme, setTheme] = useTheme();

  const runAnalysis = async (query) => {
    if (route !== 'analysis') window.location.hash = ROUTES.analysis;
    setAnalysis((s) => ({ ...s, query, loading: true, error: '' }));
    try {
      const data = await analyzeUrl(query);
      const now = new Date();
      const verdict = verdictOf(data);
      setAnalysis({
        data,
        verdict,
        query,
        reference: referenceOf(data, now),
        stamp: formatStamp(now),
        loading: false,
        error: '',
      });
      setRecent(pushRecent({ query, score: data.risk_score, level: String(data.risk_level).toLowerCase() }));
    } catch (err) {
      setAnalysis({ ...EMPTY, query, error: err.message || 'Analiz tamamlanamadı.' });
    }
  };

  const changeTlp = (value) => {
    setTlp(value);
    saveTlp(value);
  };

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-petrol-700 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-on-accent"
      >
        İçeriğe geç
      </a>

      <Sidebar
        route={route}
        recent={recent}
        onPickRecent={runAnalysis}
        onClearRecent={() => setRecent(clearRecent())}
        open={navOpen}
        onClose={() => setNavOpen(false)}
        theme={theme}
        onThemeChange={setTheme}
      />

      <div className="no-print sticky top-0 z-20 flex h-14 items-center justify-between bg-night px-4 lg:hidden">
        <Wordmark />
        <button
          type="button"
          onClick={() => setNavOpen(true)}
          className="rounded p-2 text-night-text hover:bg-night-2 hover:text-white"
          aria-label="Menüyü aç"
          aria-expanded={navOpen}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <main id="main" className="lg:pl-[248px]">
        {route === 'rules' ? (
          <RulesPage />
        ) : route === 'catalog' ? (
          <CatalogPage />
        ) : (
          <AnalysisPage
            state={analysis}
            onSearch={runAnalysis}
            onRetry={() => analysis.query && runAnalysis(analysis.query)}
            tlp={tlp}
            onTlpChange={changeTlp}
          />
        )}
      </main>
    </div>
  );
}
