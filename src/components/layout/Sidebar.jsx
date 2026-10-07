import React from 'react';
import { FileSearch, ListFilter, Building2, History, X, Sun, Moon, Monitor } from 'lucide-react';
import { Wordmark } from '../ui/Logo';
import { ROUTES } from '../../lib/useHashRoute';
import { bandOf, SEVERITY } from '../../lib/verdict';

const THEMES = [
  { id: 'light', label: 'Açık', icon: Sun },
  { id: 'dark', label: 'Koyu', icon: Moon },
  { id: 'system', label: 'Sistem', icon: Monitor },
];

const NAV = [
  { id: 'analysis', href: ROUTES.analysis, label: 'Gösterge analizi', icon: FileSearch },
  { id: 'rules', href: ROUTES.rules, label: 'Analist kuralları', icon: ListFilter },
  { id: 'catalog', href: ROUTES.catalog, label: 'Kurum kataloğu', icon: Building2 },
];

export function Sidebar({ route, recent, onPickRecent, onClearRecent, open, onClose, theme, onThemeChange }) {
  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-night/40 transition-opacity duration-200 lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <aside
        className={`no-print fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col bg-night text-ink-inverse transition-transform duration-200 ease-out lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <a href={ROUTES.analysis} onClick={onClose} aria-label="Mihenk ana sayfa">
            <Wordmark />
          </a>
          <button type="button" onClick={onClose} className="rounded p-1.5 text-night-text hover:bg-night-2 hover:text-white lg:hidden" aria-label="Menüyü kapat">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav aria-label="Ana menü" className="mt-3 px-3">
          <ul className="space-y-0.5">
            {NAV.map(({ id, href, label, icon: Icon }) => {
              const active = route === id;
              return (
                <li key={id}>
                  <a
                    href={href}
                    onClick={onClose}
                    aria-current={active ? 'page' : undefined}
                    className={`flex h-9 items-center gap-3 rounded px-3 text-sm font-medium transition-colors duration-150 ${
                      active ? 'bg-night-3 text-white' : 'text-night-text hover:bg-night-2 hover:text-white'
                    }`}
                  >
                    <Icon aria-hidden="true" className={`h-4 w-4 ${active ? 'text-brass' : ''}`} />
                    {label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <section aria-labelledby="recent-h" className="mt-8 flex min-h-0 flex-1 flex-col px-3">
          <div className="flex items-center justify-between px-3">
            <h2 id="recent-h" className="flex items-center gap-2 text-xs font-semibold text-night-text">
              <History aria-hidden="true" className="h-3.5 w-3.5" />
              Son analizler
            </h2>
            {recent.length > 0 && (
              <button type="button" onClick={onClearRecent} className="rounded px-1.5 py-0.5 text-2xs text-night-text hover:bg-night-2 hover:text-white">
                Temizle
              </button>
            )}
          </div>

          {recent.length === 0 ? (
            <p className="mt-3 px-3 text-xs leading-relaxed text-night-text">
              Analiz ettiğiniz göstergeler burada listelenir.
            </p>
          ) : (
            <ul className="mt-2 min-h-0 space-y-px overflow-y-auto">
              {recent.map((r) => {
                const sev = SEVERITY[r.level === 'safe' ? 'low' : bandOf(r.score).key];
                return (
                  <li key={r.query}>
                    <button
                      type="button"
                      onClick={() => {
                        onPickRecent(r.query);
                        onClose();
                      }}
                      className="group flex w-full items-center gap-3 rounded px-3 py-2 text-left transition-colors duration-150 hover:bg-night-2"
                      title={r.query}
                    >
                      <span className="data w-7 shrink-0 text-right text-xs font-semibold text-white">{r.score}</span>
                      <span aria-hidden="true" className={`h-3 w-px shrink-0 ${sev.bg}`} />
                      <span className="data min-w-0 flex-1 truncate text-xs text-night-text group-hover:text-white">
                        {r.query.replace(/^https?:\/\//, '')}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="px-3 pb-4 pt-2 text-2xs leading-snug text-night-text">Yalnızca bu tarayıcıda saklanır.</p>
        </section>

        <div className="border-t border-night-3 px-5 py-4">
          <div role="radiogroup" aria-label="Görünüm" className="grid grid-cols-3 gap-1 rounded bg-night-2 p-1">
            {THEMES.map(({ id, label, icon: Icon }) => {
              const active = theme === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onThemeChange(id)}
                  className={`flex h-7 items-center justify-center gap-1.5 rounded-sm text-2xs font-medium transition-colors duration-150 ${
                    active ? 'bg-night-3 text-white' : 'text-night-text hover:text-white'
                  }`}
                >
                  <Icon aria-hidden="true" className="h-3.5 w-3.5" />
                  {label}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-2xs leading-relaxed text-night-text">Kaynaklar: WHOIS · DNS · AbuseIPDB · VirusTotal</p>
        </div>
      </aside>
    </>
  );
}
