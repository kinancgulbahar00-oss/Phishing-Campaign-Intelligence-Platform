import React, { useEffect, useMemo, useState } from 'react';
import { Ban, ShieldCheck, Plus, Search, AlertCircle, Loader2, Trash2, Lock, ShieldAlert } from 'lucide-react';
import { fetchLists, addListItem, deleteListItem, adminVerify } from '../api/client';

const TABS = {
  blacklist: {
    label: 'Engel listesi (Blacklist)',
    icon: Ban,
    iconClass: 'text-risk-critical',
    effect: 'Eşleşen gösterge harici sorgu beklenmeden Kritik (100) olarak değerlendirilir.',
    empty: 'Engel listesi boş. Bilinen oltalama alan adlarını, IP adreslerini veya tam URL’leri buraya ekleyin.',
  },
  whitelist: {
    label: 'İzin listesi (Whitelist)',
    icon: ShieldCheck,
    iconClass: 'text-risk-low',
    effect: 'Eşleşen gösterge harici sorgular atlanarak İzinli olarak işaretlenir.',
    empty: 'İzin listesi boş. Kurumunuza ait ve yanlış alarm üreten alan adlarını buraya ekleyin.',
  },
};

const TYPES = {
  domain: { label: 'Alan adı', placeholder: 'ornek-banka.com.tr' },
  ip: { label: 'IP adresi', placeholder: '203.0.113.24' },
  url: { label: 'Tam URL', placeholder: 'https://ornek.com/giris' },
};

const dateFmt = new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });

function DeleteButton({ onConfirm }) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!armed) {
    return (
      <button type="button" onClick={() => setArmed(true)} className="btn-quiet h-8 px-2" aria-label="Kuralı sil">
        <Trash2 aria-hidden="true" className="h-4 w-4 text-risk-critical" />
      </button>
    );
  }
  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const ok = await onConfirm();
          if (!ok) {
            setBusy(false);
            setArmed(false);
          }
        }}
        className="btn h-8 bg-risk-critical px-2.5 text-xs text-white hover:bg-risk-critical/90"
      >
        {busy ? <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" /> : 'Sil'}
      </button>
      <button type="button" onClick={() => setArmed(false)} className="btn-quiet h-8 px-2.5 text-xs">
        Vazgeç
      </button>
    </span>
  );
}

export function RulesPage({ onChanged, isAdmin: propIsAdmin }) {
  const [isAdmin, setIsAdmin] = useState(Boolean(propIsAdmin));
  const [tab, setTab] = useState('blacklist');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const [entryType, setEntryType] = useState('domain');
  const [pattern, setPattern] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function checkAuth() {
      if (typeof propIsAdmin === 'boolean') {
        setIsAdmin(propIsAdmin);
        return;
      }
      try {
        const res = await adminVerify();
        if (mounted) setIsAdmin(res.valid === true);
      } catch {
        if (mounted) setIsAdmin(false);
      }
    }
    checkAuth();
    return () => {
      mounted = false;
    };
  }, [propIsAdmin]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await fetchLists());
    } catch (err) {
      setError(err.message || 'Kurallar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(
    () => ({
      blacklist: items.filter((i) => i.list_type === 'blacklist').length,
      whitelist: items.filter((i) => i.list_type === 'whitelist').length,
    }),
    [items]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((i) => i.list_type === tab)
      .filter((i) => !q || i.pattern.toLowerCase().includes(q) || (i.description || '').toLowerCase().includes(q));
  }, [items, tab, query]);

  const add = async (e) => {
    e.preventDefault();
    if (!pattern.trim()) return;
    setSubmitting(true);
    setFormError('');
    try {
      const created = await addListItem({
        list_type: tab,
        entry_type: entryType,
        pattern: pattern.trim(),
        description: note.trim() || undefined,
      });
      setItems((prev) => [created, ...prev]);
      setPattern('');
      setNote('');
      onChanged?.();
    } catch (err) {
      setFormError(err.message || 'Kural eklenemedi.');
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id) => {
    try {
      await deleteListItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      return true;
    } catch (err) {
      setError(err.message || 'Kural silinemedi.');
      return false;
    }
  };

  const T = TABS[tab];

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-8 lg:py-10">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">İzin & Engel Listeleri</h1>
          <p className="mt-1 max-w-[70ch] text-sm text-ink-2">
            Analiz motorunun öncelikli olarak başvurduğu kurumsal listelerdir. Eşleşen göstergeler harici CTI servisleri
            beklenmeksizin doğrudan karara bağlanır.
          </p>
        </div>

        {isAdmin ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Yönetici Modu Aktif
          </span>
        ) : (
          <a
            href="#/admin"
            className="inline-flex items-center gap-1.5 rounded border border-line bg-sunken px-3 py-1.5 text-xs font-medium text-ink-2 hover:bg-night-2 hover:text-white transition-colors"
          >
            <Lock className="h-3.5 w-3.5 text-amber-500" />
            Yönetici Girişi Yap
          </a>
        )}
      </header>

      <div className="sheet border border-line shadow-sheet">
        {/* Tabs */}
        <div role="tablist" aria-label="Liste türü" className="flex border-b border-line px-2 sm:px-4">
          {Object.entries(TABS).map(([key, t]) => {
            const active = tab === key;
            const Icon = t.icon;
            return (
              <button
                key={key}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => {
                  setTab(key);
                  setFormError('');
                }}
                className={`relative -mb-px flex h-12 items-center gap-2 border-b-2 px-3 text-sm font-semibold transition-colors duration-150 sm:px-4 ${
                  active ? 'border-ink text-ink' : 'border-transparent text-ink-3 hover:text-ink'
                }`}
              >
                <Icon aria-hidden="true" className={`h-4 w-4 ${active ? t.iconClass : ''}`} />
                {t.label}
                <span className="data rounded-sm bg-sunken px-1.5 py-0.5 text-2xs font-semibold text-ink-2">
                  {loading ? '–' : counts[key]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Admin only Add Form OR Normal Analyst Notice */}
        {isAdmin ? (
          <form onSubmit={add} className="border-b border-line bg-sunken px-4 py-5 sm:px-6" aria-label={`${T.label} için yeni kural`}>
            <p className="mb-3 text-xs font-medium text-ink-2">{T.effect}</p>
            <div className="grid gap-2 md:grid-cols-[9.5rem_minmax(0,1.2fr)_minmax(0,1fr)_auto]">
              <label className="sr-only" htmlFor="rule-type">Kural türü</label>
              <select id="rule-type" value={entryType} onChange={(e) => setEntryType(e.target.value)} className="field cursor-pointer">
                {Object.entries(TYPES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
              <label className="sr-only" htmlFor="rule-pattern">Kalıp</label>
              <input
                id="rule-pattern"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder={TYPES[entryType].placeholder}
                autoComplete="off"
                spellCheck="false"
                className="field data text-xs"
              />
              <label className="sr-only" htmlFor="rule-note">Gerekçe</label>
              <input
                id="rule-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Gerekçe (isteğe bağlı)"
                className="field text-xs"
              />
              <button type="submit" disabled={submitting || !pattern.trim()} className="btn-primary text-xs">
                {submitting ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Plus aria-hidden="true" className="h-4 w-4" />}
                Kural ekle
              </button>
            </div>
            {formError && (
              <p role="alert" className="mt-2 flex items-center gap-1.5 text-xs text-risk-critical">
                <AlertCircle aria-hidden="true" className="h-3.5 w-3.5" />
                {formError}
              </p>
            )}
          </form>
        ) : (
          <div className="border-b border-line bg-sunken/60 px-4 py-3.5 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs text-ink-2">
                <Lock className="h-4 w-4 shrink-0 text-amber-500" />
                <span>
                  <strong>Yönetici Denetimi:</strong> İzin ve Engel listesine yeni kural ekleme ve silme yetkisi yalnızca{' '}
                  <strong>Yönetici (Admin)</strong> rolündedir.
                </span>
              </div>
              <a
                href="#/admin"
                className="inline-flex items-center gap-1 text-xs font-semibold text-petrol-700 hover:underline"
              >
                Yönetici Paneline Git →
              </a>
            </div>
          </div>
        )}

        {/* Search bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="relative w-full max-w-xs">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
            <label htmlFor="rule-search" className="sr-only">Kurallarda ara</label>
            <input
              id="rule-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Kalıp veya gerekçede ara"
              className="field pl-9 text-xs"
            />
          </div>
          <span className="text-xs text-ink-3">
            {visible.length} kayıt{query && ` · “${query}” için`}
          </span>
        </div>

        {error && (
          <div role="alert" className="mx-4 mb-4 flex items-center gap-2 rounded bg-risk-critical/10 px-3 py-2.5 text-sm text-risk-critical sm:mx-6">
            <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-xs">{error}</span>
            <button type="button" onClick={load} className="text-xs font-semibold underline">
              Tekrar dene
            </button>
          </div>
        )}

        {loading ? (
          <p className="flex items-center gap-2 border-t border-line px-6 py-10 text-sm text-ink-3">
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin text-petrol-700" />
            Kurallar yükleniyor...
          </p>
        ) : visible.length === 0 ? (
          <p className="border-t border-line px-4 py-10 text-sm text-ink-3 sm:px-6 text-center">
            {query ? 'Aramanızla eşleşen kural yok.' : T.empty}
          </p>
        ) : (
          <div className="overflow-x-auto border-t border-line">
            <table className="w-full min-w-[640px] text-left text-sm">
              <caption className="sr-only">{T.label}</caption>
              <thead>
                <tr className="border-b border-line-strong text-xs font-semibold text-ink-3">
                  <th scope="col" className="w-28 py-2.5 pl-4 pr-3 sm:pl-6">Tür</th>
                  <th scope="col" className="py-2.5 pr-3">Kalıp (Pattern)</th>
                  <th scope="col" className="py-2.5 pr-3">Gerekçe / Not</th>
                  <th scope="col" className="w-32 py-2.5 pr-3">Eklenme Tarihi</th>
                  {isAdmin && (
                    <th scope="col" className="w-24 py-2.5 pr-4 text-right sm:pr-6">
                      İşlem
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((item) => (
                  <tr key={item.id} className="transition-colors duration-150 hover:bg-sunken">
                    <td className="py-2.5 pl-4 pr-3 text-xs text-ink-2 sm:pl-6">
                      <span className="rounded bg-sunken px-2 py-0.5 font-medium border border-line">
                        {TYPES[item.entry_type]?.label || item.entry_type}
                      </span>
                    </td>
                    <td className="font-mono break-all py-2.5 pr-3 text-xs font-semibold text-ink">{item.pattern}</td>
                    <td className="py-2.5 pr-3 text-xs text-ink-2">
                      {item.description || <span className="text-ink-3 italic">Açıklama yok</span>}
                    </td>
                    <td className="font-mono py-2.5 pr-3 text-2xs text-ink-3">
                      {item.created_at ? dateFmt.format(new Date(item.created_at)) : '–'}
                    </td>
                    {isAdmin && (
                      <td className="py-2.5 pr-4 text-right sm:pr-6">
                        <DeleteButton onConfirm={() => remove(item.id)} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
