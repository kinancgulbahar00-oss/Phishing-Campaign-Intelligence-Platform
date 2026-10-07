import React, { useEffect, useMemo, useState } from 'react';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { fetchBrands } from '../api/client';

// Taklit tespiti yapilan kurumlar. Salt okunur: katalog backend/data/tr_brands.json dosyasindan gelir.
export function CatalogPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [sector, setSector] = useState('all');

  const load = async () => {
    setError('');
    try {
      setData(await fetchBrands());
    } catch (err) {
      setError(err.message || 'Katalog yüklenemedi.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLocaleLowerCase('tr-TR');
    return data.brands
      .filter((b) => sector === 'all' || b.sector === sector)
      .filter(
        (b) =>
          !q ||
          b.name.toLocaleLowerCase('tr-TR').includes(q) ||
          b.domains.some((d) => d.includes(q))
      );
  }, [data, query, sector]);

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-8 lg:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-[-0.01em]">Kurum kataloğu</h1>
        <p className="mt-1 max-w-[72ch] text-sm text-ink-2">
          Mihenk, bu kurumların adını, yazım benzerlerini ve sayfa kimliğini taşıyan ama resmi adreslerinde olmayan
          sayfaları taklit olarak işaretler. Listede olmayan kamu kurumları da .gov.tr ve .bel.tr dışındaki kullanımlarda
          yakalanır.
        </p>
      </header>

      {error && (
        <div role="alert" className="mb-4 flex items-center gap-2 rounded bg-risk-critical/[0.07] px-3 py-2.5 text-sm text-risk-critical">
          <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button type="button" onClick={load} className="font-semibold underline">
            Tekrar dene
          </button>
        </div>
      )}

      <div className="sheet">
        <div className="flex flex-wrap items-center gap-x-1 gap-y-1 border-b border-line px-3 py-3 sm:px-5">
          <SectorChip active={sector === 'all'} onClick={() => setSector('all')} label="Tümü" count={data?.total} />
          {data?.sectors
            .filter((s) => s.count > 0)
            .map((s) => (
              <SectorChip key={s.id} active={sector === s.id} onClick={() => setSector(s.id)} label={s.label} count={s.count} />
            ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="relative w-full max-w-xs">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
            <label htmlFor="catalog-search" className="sr-only">Kurum veya alan adı ara</label>
            <input
              id="catalog-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Kurum veya alan adı ara"
              className="field pl-9"
            />
          </div>
          <span className="text-xs text-ink-3">{data ? `${visible.length} kurum` : ''}</span>
        </div>

        {!data && !error ? (
          <p className="flex items-center gap-2 border-t border-line px-6 py-10 text-sm text-ink-3">
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            Katalog yükleniyor
          </p>
        ) : visible.length === 0 ? (
          <p className="border-t border-line px-4 py-10 text-sm text-ink-3 sm:px-6">Aramanızla eşleşen kurum yok.</p>
        ) : (
          <div className="border-t border-line">
            <table className="hidden w-full text-left text-sm sm:table">
              <caption className="sr-only">Kurum kataloğu</caption>
              <thead>
                <tr className="border-b border-line-strong text-xs text-ink-3">
                  <th scope="col" className="py-2 pl-6 pr-3 font-medium">Kurum</th>
                  <th scope="col" className="w-48 py-2 pr-3 font-medium">Sektör</th>
                  <th scope="col" className="py-2 pr-6 font-medium">Resmi alan adları</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((b) => (
                  <tr key={b.id} className="transition-colors duration-150 hover:bg-sunken">
                    <td className="py-2 pl-6 pr-3 font-medium text-ink">{b.name}</td>
                    <td className="py-2 pr-3 text-ink-2">{b.sector_label}</td>
                    <td className="data py-2 pr-6 text-[0.8125rem] text-ink-2 [overflow-wrap:anywhere]">{b.domains.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="divide-y divide-line sm:hidden">
              {visible.map((b) => (
                <li key={b.id} className="px-4 py-2.5">
                  <p className="text-sm font-medium text-ink">{b.name}</p>
                  <p className="text-xs text-ink-3">{b.sector_label}</p>
                  <p className="data mt-0.5 text-xs text-ink-2 [overflow-wrap:anywhere]">{b.domains.join(', ')}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function SectorChip({ active, onClick, label, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-8 items-center gap-1.5 rounded px-2.5 text-xs font-medium transition-colors duration-150 ${
        active ? 'bg-ink text-sheet' : 'text-ink-2 hover:bg-sunken hover:text-ink'
      }`}
    >
      {label}
      {count != null && <span className={`data text-2xs ${active ? 'text-sheet/70' : 'text-ink-3'}`}>{count}</span>}
    </button>
  );
}
