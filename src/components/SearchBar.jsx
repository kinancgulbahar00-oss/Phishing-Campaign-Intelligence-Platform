import React, { useState } from 'react';
import { Search, Loader2, CornerDownLeft } from 'lucide-react';

const EXAMPLES = ['login-verify-account.com', 'secure-bank-update.net', 'kargo-takip-tr.com'];

export function SearchBar({ onSearch, loading }) {
  const [inputUrl, setInputUrl] = useState('');

  const submit = (value) => {
    const v = (value ?? inputUrl).trim();
    if (v) onSearch(v);
  };

  return (
    <div className="w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label htmlFor="ioc-input" className="mb-2 block text-eyebrow font-semibold uppercase text-ink-3">
          Gösterge · IOC Sorgusu
        </label>

        <div className="group relative flex items-center rounded-panel border border-line bg-surface shadow-panel transition-colors duration-200 focus-within:border-brand-500/60">
          <Search aria-hidden="true" className="pointer-events-none absolute left-4 h-[18px] w-[18px] text-ink-3" />
          <input
            id="ioc-input"
            name="ioc"
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="URL veya domain girin — örn. http://login-verify-account.com"
            autoComplete="off"
            spellCheck="false"
            disabled={loading}
            className="data w-full bg-transparent py-4 pl-12 pr-3 text-[15px] text-ink placeholder:font-sans placeholder:tracking-normal placeholder:text-ink-3 focus:outline-none disabled:opacity-60 sm:pr-44"
          />
          <button
            type="submit"
            disabled={loading || !inputUrl.trim()}
            className="mr-2 inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-[10px] bg-brand-400 px-5 py-2.5 text-sm font-semibold text-canvas transition-colors duration-200 hover:bg-brand-300 disabled:cursor-not-allowed disabled:bg-brand-400/20 disabled:text-brand-200/60"
          >
            {loading ? (
              <>
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                Analiz ediliyor
              </>
            ) : (
              <>
                Analiz Et
                <CornerDownLeft aria-hidden="true" className="hidden h-3.5 w-3.5 opacity-70 sm:block" />
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-ink-3">Örnek:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            disabled={loading}
            onClick={() => {
              setInputUrl(ex);
              submit(ex);
            }}
            className="data cursor-pointer rounded-full border border-line bg-surface-2 px-3 py-1 text-[11px] text-ink-2 transition-colors duration-200 hover:border-line-strong hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
