import React, { useEffect, useRef, useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

const EXAMPLES = ['login-verify-account.com', 'secure-bank-update.net', 'kargo-takip-tr.com'];

export function SearchBar({ onSearch, loading, value }) {
  const [input, setInput] = useState('');
  const ref = useRef(null);

  // Kenar cubugundan bir gecmis kaydi secilince alan da guncellenir
  useEffect(() => {
    if (value != null) setInput(value);
  }, [value]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const submit = (v) => {
    const q = (v ?? input).trim();
    if (q) onSearch(q);
  };

  return (
    <div className="no-print">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <label htmlFor="ioc-input" className="sr-only">
          İncelenecek URL veya alan adı
        </label>
        <div className="relative flex-1">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-3" />
          <input
            ref={ref}
            id="ioc-input"
            name="ioc"
            type="text"
            inputMode="url"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="URL veya alan adı yapıştırın"
            autoComplete="off"
            spellCheck="false"
            disabled={loading}
            className="data h-12 w-full rounded border border-line-strong bg-sheet pl-11 pr-12 text-[0.9375rem] text-ink shadow-sheet transition-colors duration-150 placeholder:font-sans hover:border-ink-3 focus:border-petrol-600 focus:outline-none focus:ring-2 focus:ring-petrol-600/20 disabled:bg-sunken disabled:text-ink-2"
          />
          <kbd className="data pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-sm border border-line px-1.5 text-2xs text-ink-3 sm:block">
            /
          </kbd>
        </div>
        <button type="submit" disabled={loading || !input.trim()} className="btn-primary h-12 px-6 text-[0.9375rem]">
          {loading ? (
            <>
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              Analiz ediliyor
            </>
          ) : (
            'Analiz et'
          )}
        </button>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <span className="text-xs text-ink-3">Örnek göstergeler</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            disabled={loading}
            onClick={() => {
              setInput(ex);
              submit(ex);
            }}
            className="data rounded-sm px-1.5 py-0.5 text-xs text-petrol-700 underline decoration-petrol-700/30 underline-offset-[3px] transition-colors duration-150 hover:bg-petrol-50 hover:decoration-petrol-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
