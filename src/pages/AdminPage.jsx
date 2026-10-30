import React, { useEffect, useMemo, useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Ban,
  Lock,
  Unlock,
  KeyRound,
  Plus,
  Trash2,
  Search,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Server,
  Activity,
  LogOut,
  Eye,
  EyeOff,
  Database,
  Globe2,
} from 'lucide-react';
import {
  adminLogin,
  adminVerify,
  clearAdminToken,
  fetchAdminStats,
  fetchLists,
  addListItem,
  deleteListItem,
} from '../api/client';

const TABS = {
  blacklist: {
    label: 'Engel listesi (Blacklist)',
    icon: Ban,
    iconClass: 'text-risk-critical',
    desc: 'Buraya eklenen alan adı, IP veya URL sorgulandığında hiçbir harici servis beklenmeden doğrudan KRİTİK (100) olarak etiketlenir.',
    empty: 'Engel listesinde kayıtlı kural bulunmuyor.',
  },
  whitelist: {
    label: 'İzin listesi (Whitelist)',
    icon: ShieldCheck,
    iconClass: 'text-risk-low',
    desc: 'Buraya eklenen alan adları kurumunuza ait veya güvenilir kabul edilir; harici sorgular atlanarak İZİNLİ (0) olarak raporlanır.',
    empty: 'İzin listesinde kayıtlı kural bulunmuyor.',
  },
};

const TYPES = {
  domain: { label: 'Alan adı', placeholder: 'ornek-phishing.com' },
  ip: { label: 'IP adresi', placeholder: '198.51.100.15' },
  url: { label: 'Tam URL', placeholder: 'https://ornek.com/login' },
};

const dateFmt = new Intl.DateTimeFormat('tr-TR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function DeleteButton({ onConfirm }) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        className="btn-quiet h-8 px-2 text-risk-critical hover:bg-risk-critical/10"
        title="Kuralı sil"
      >
        <Trash2 aria-hidden="true" className="h-4 w-4" />
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
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
      <button
        type="button"
        onClick={() => setArmed(false)}
        className="btn-quiet h-8 px-2 text-xs"
      >
        İptal
      </button>
    </span>
  );
}

export function AdminPage({ onAdminStatusChange }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Login form states
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Admin Dashboard states
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('blacklist');
  const [items, setItems] = useState([]);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [rulesError, setRulesError] = useState('');
  const [query, setQuery] = useState('');

  // Add rule form states
  const [entryType, setEntryType] = useState('domain');
  const [pattern, setPattern] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Check existing session on mount
  useEffect(() => {
    let mounted = true;
    async function verify() {
      setCheckingAuth(true);
      try {
        const res = await adminVerify();
        if (mounted) {
          setIsAdmin(res.valid === true);
          onAdminStatusChange?.(res.valid === true);
        }
      } catch {
        if (mounted) {
          setIsAdmin(false);
          onAdminStatusChange?.(false);
        }
      } finally {
        if (mounted) setCheckingAuth(false);
      }
    }
    verify();
    return () => {
      mounted = false;
    };
  }, [onAdminStatusChange]);

  // Load rules and stats when authenticated
  const loadData = async () => {
    setStatsLoading(true);
    setRulesLoading(true);
    setRulesError('');
    try {
      const [statsData, rulesData] = await Promise.all([
        fetchAdminStats().catch(() => null),
        fetchLists(),
      ]);
      setStats(statsData);
      setItems(rulesData || []);
    } catch (err) {
      setRulesError(err.message || 'Veriler yüklenirken hata oluştu.');
    } finally {
      setStatsLoading(false);
      setRulesLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoginLoading(true);
    setLoginError('');
    try {
      await adminLogin(password.trim(), rememberMe);
      setIsAdmin(true);
      onAdminStatusChange?.(true);
      setPassword('');
    } catch (err) {
      setLoginError(err.message || 'Giriş yapılamadı.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    clearAdminToken();
    setIsAdmin(false);
    onAdminStatusChange?.(false);
    setStats(null);
    setItems([]);
  };

  const handleAddRule = async (e) => {
    e.preventDefault();
    if (!pattern.trim()) return;

    setSubmitting(true);
    setFormError('');
    setFormSuccess('');
    try {
      const created = await addListItem({
        list_type: activeTab,
        entry_type: entryType,
        pattern: pattern.trim(),
        description: note.trim() || undefined,
      });

      setItems((prev) => [created, ...prev]);
      setPattern('');
      setNote('');
      setFormSuccess(`Kural başarıyla ${TABS[activeTab].label} listesine eklendi.`);
      setTimeout(() => setFormSuccess(''), 4000);

      // Refresh stats count
      setStats((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          blacklist_count: activeTab === 'blacklist' ? prev.blacklist_count + 1 : prev.blacklist_count,
          whitelist_count: activeTab === 'whitelist' ? prev.whitelist_count + 1 : prev.whitelist_count,
        };
      });
    } catch (err) {
      setFormError(err.message || 'Kural eklenemedi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRule = async (id) => {
    try {
      await deleteListItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));

      setStats((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          blacklist_count: activeTab === 'blacklist' ? Math.max(0, prev.blacklist_count - 1) : prev.blacklist_count,
          whitelist_count: activeTab === 'whitelist' ? Math.max(0, prev.whitelist_count - 1) : prev.whitelist_count,
        };
      });
      return true;
    } catch (err) {
      setRulesError(err.message || 'Kural silinemedi.');
      return false;
    }
  };

  const counts = useMemo(
    () => ({
      blacklist: items.filter((i) => i.list_type === 'blacklist').length,
      whitelist: items.filter((i) => i.list_type === 'whitelist').length,
    }),
    [items]
  );

  const visibleRules = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((i) => i.list_type === activeTab)
      .filter(
        (i) =>
          !q ||
          i.pattern.toLowerCase().includes(q) ||
          (i.description || '').toLowerCase().includes(q)
      );
  }, [items, activeTab, query]);

  if (checkingAuth) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-2.5 text-sm text-ink-3">
          <Loader2 className="h-5 w-5 animate-spin text-petrol-600" />
          Yönetici yetkisi doğrulanıyor...
        </div>
      </div>
    );
  }

  // LOGIN SCREEN
  if (!isAdmin) {
    return (
      <div className="mx-auto w-full max-w-[620px] px-4 py-12 sm:px-6">
        <div className="sheet overflow-hidden border border-line shadow-sheet">
          <div className="border-b border-line bg-sunken px-6 py-6 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-petrol-700/10 text-petrol-700">
                <Lock className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-ink">Yönetici Paneli (SOC Admin)</h1>
                <p className="text-xs text-ink-2">İzin ve Engel Listesi Yönetim Konsolu</p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="mb-6 rounded-lg border border-line bg-sunken/60 p-4 text-xs text-ink-2">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <div className="leading-relaxed">
                  <p className="font-semibold text-ink">Yetki Sınırlandırması</p>
                  <p className="mt-0.5">
                    Kurumsal güvenlik politikası gereği <strong>İzin Listesi (Whitelist)</strong> ve{' '}
                    <strong>Engel Listesi (Blacklist)</strong> üzerinde yeni kural ekleme ve silme işlemleri yalnızca yetkili
                    yöneticiler tarafından gerçekleştirilebilir.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="admin-pass" className="mb-1.5 block text-xs font-semibold text-ink">
                  Yönetici Parolası
                </label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
                  <input
                    id="admin-pass"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Parolanızı girin"
                    autoComplete="current-password"
                    autoFocus
                    className="field w-full pl-9 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink"
                    title={showPassword ? 'Parolayı gizle' : 'Parolayı göster'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center text-xs text-ink-2">
                <label className="flex cursor-pointer items-center gap-2 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-line text-petrol-700 focus:ring-petrol-600"
                  />
                  Bu tarayıcıda oturumu hatırla
                </label>
              </div>

              {loginError && (
                <div role="alert" className="flex items-center gap-2 rounded bg-risk-critical/10 p-3 text-xs text-risk-critical">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loginLoading || !password.trim()}
                className="btn-primary mt-2 flex w-full items-center justify-center gap-2 py-2.5 text-sm"
              >
                {loginLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Doğrulanıyor...
                  </>
                ) : (
                  <>
                    <Unlock className="h-4 w-4" />
                    Yönetici Olarak Giriş Yap
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ADMIN CONSOLE SCREEN
  const T = TABS[activeTab];

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-8 lg:py-10">
      {/* Top Header */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-ink">Yönetici Paneli (Admin Console)</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Oturum Aktif
            </span>
          </div>
          <p className="mt-1 text-sm text-ink-2">
            İzin ve Engel listelerini düzenleyebilir, kurumsal istihbarat filtrelerini doğrudan yönetebilirsiniz.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="btn-quiet flex items-center gap-2 rounded border border-line px-3.5 py-2 text-xs font-medium text-ink-2 hover:bg-risk-critical/10 hover:text-risk-critical hover:border-risk-critical/30 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Yönetici Çıkışı
        </button>
      </header>

      {/* System Metric Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="sheet p-4 border border-line">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-3">Engel Listesi</span>
            <Ban className="h-4 w-4 text-risk-critical" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-ink">{counts.blacklist}</span>
            <span className="text-3xs text-ink-3">aktif kural</span>
          </div>
        </div>

        <div className="sheet p-4 border border-line">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-3">İzin Listesi</span>
            <ShieldCheck className="h-4 w-4 text-risk-low" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-ink">{counts.whitelist}</span>
            <span className="text-3xs text-ink-3">güvenli kayıt</span>
          </div>
        </div>

        <div className="sheet p-4 border border-line">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-3">Vaka Sayısı</span>
            <Globe2 className="h-4 w-4 text-petrol-700" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-ink">{stats?.total_iocs ?? '–'}</span>
            <span className="text-3xs text-ink-3">toplam vaka</span>
          </div>
        </div>

        <div className="sheet p-4 border border-line">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-3">CTI Altyapısı</span>
            <Database className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-sm font-bold text-ink">{stats?.database_type || 'PostgreSQL'}</span>
            <span className="text-3xs text-emerald-600 dark:text-emerald-400 font-medium">Sağlıklı</span>
          </div>
        </div>
      </div>

      {/* Main Rules Management Sheet */}
      <div className="sheet border border-line shadow-sheet">
        {/* Tabs */}
        <div role="tablist" aria-label="Liste yönetimi" className="flex border-b border-line px-2 sm:px-4">
          {Object.entries(TABS).map(([key, t]) => {
            const active = activeTab === key;
            const Icon = t.icon;
            return (
              <button
                key={key}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => {
                  setActiveTab(key);
                  setFormError('');
                  setFormSuccess('');
                }}
                className={`relative -mb-px flex h-12 items-center gap-2 border-b-2 px-3 text-sm font-semibold transition-colors duration-150 sm:px-4 ${
                  active ? 'border-ink text-ink' : 'border-transparent text-ink-3 hover:text-ink'
                }`}
              >
                <Icon aria-hidden="true" className={`h-4 w-4 ${active ? t.iconClass : ''}`} />
                {t.label}
                <span className="rounded-sm bg-sunken px-1.5 py-0.5 text-2xs font-semibold text-ink-2">
                  {rulesLoading ? '–' : counts[key]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Add Rule Form */}
        <form onSubmit={handleAddRule} className="border-b border-line bg-sunken px-4 py-5 sm:px-6">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-ink-2">{T.desc}</p>
            <span className="rounded bg-petrol-700/10 px-2 py-0.5 text-3xs font-semibold text-petrol-700">
              Admin Yetkisi
            </span>
          </div>

          <div className="grid gap-2 md:grid-cols-[9.5rem_minmax(0,1.2fr)_minmax(0,1fr)_auto]">
            <label className="sr-only" htmlFor="admin-rule-type">
              Kural türü
            </label>
            <select
              id="admin-rule-type"
              value={entryType}
              onChange={(e) => setEntryType(e.target.value)}
              className="field cursor-pointer"
            >
              {Object.entries(TYPES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>

            <label className="sr-only" htmlFor="admin-rule-pattern">
              Kalıp
            </label>
            <input
              id="admin-rule-pattern"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder={TYPES[entryType].placeholder}
              autoComplete="off"
              spellCheck="false"
              className="field font-mono text-xs"
            />

            <label className="sr-only" htmlFor="admin-rule-note">
              Gerekçe
            </label>
            <input
              id="admin-rule-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Gerekçe / Bilet No (Örn: SOC-9842)"
              className="field text-xs"
            />

            <button
              type="submit"
              disabled={submitting || !pattern.trim()}
              className="btn-primary flex items-center justify-center gap-1.5 px-4 text-xs font-semibold"
            >
              {submitting ? (
                <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus aria-hidden="true" className="h-3.5 w-3.5" />
              )}
              Kural Ekle
            </button>
          </div>

          {formError && (
            <p role="alert" className="mt-2.5 flex items-center gap-1.5 text-xs text-risk-critical">
              <AlertCircle aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              {formError}
            </p>
          )}

          {formSuccess && (
            <p role="status" className="mt-2.5 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              {formSuccess}
            </p>
          )}
        </form>

        {/* Filter and Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="relative w-full max-w-xs">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3"
            />
            <label htmlFor="admin-rule-search" className="sr-only">
              Kurallarda ara
            </label>
            <input
              id="admin-rule-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Kalıp veya gerekçede filtrele"
              className="field pl-9 text-xs"
            />
          </div>
          <span className="text-xs text-ink-3">
            {visibleRules.length} kayıt{query && ` · “${query}” için`}
          </span>
        </div>

        {rulesError && (
          <div role="alert" className="mx-4 mb-4 flex items-center gap-2 rounded bg-risk-critical/10 px-3 py-2.5 text-sm text-risk-critical sm:mx-6">
            <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-xs">{rulesError}</span>
            <button type="button" onClick={loadData} className="text-xs font-semibold underline">
              Tekrar dene
            </button>
          </div>
        )}

        {/* Rules Table */}
        {rulesLoading ? (
          <p className="flex items-center gap-2 border-t border-line px-6 py-12 text-sm text-ink-3">
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin text-petrol-700" />
            Kurallar yükleniyor...
          </p>
        ) : visibleRules.length === 0 ? (
          <div className="border-t border-line px-4 py-12 text-center text-sm text-ink-3 sm:px-6">
            <p>{query ? 'Aramanızla eşleşen kural bulunamadı.' : T.empty}</p>
          </div>
        ) : (
          <div className="overflow-x-auto border-t border-line">
            <table className="w-full min-w-[640px] text-left text-sm">
              <caption className="sr-only">{T.label}</caption>
              <thead>
                <tr className="border-b border-line-strong text-xs font-semibold text-ink-3">
                  <th scope="col" className="w-28 py-2.5 pl-4 pr-3 sm:pl-6">
                    Tür
                  </th>
                  <th scope="col" className="py-2.5 pr-3">
                    Kalıp (Pattern)
                  </th>
                  <th scope="col" className="py-2.5 pr-3">
                    Gerekçe / Not
                  </th>
                  <th scope="col" className="w-36 py-2.5 pr-3">
                    Eklenme Tarihi
                  </th>
                  <th scope="col" className="w-24 py-2.5 pr-4 text-right sm:pr-6">
                    İşlem
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visibleRules.map((item) => (
                  <tr key={item.id} className="transition-colors duration-150 hover:bg-sunken">
                    <td className="py-2.5 pl-4 pr-3 text-xs text-ink-2 sm:pl-6">
                      <span className="rounded bg-sunken px-2 py-0.5 font-medium border border-line">
                        {TYPES[item.entry_type]?.label || item.entry_type}
                      </span>
                    </td>
                    <td className="font-mono break-all py-2.5 pr-3 text-xs font-semibold text-ink">
                      {item.pattern}
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-ink-2">
                      {item.description || <span className="text-ink-3 italic">Açıklama belirtilmedi</span>}
                    </td>
                    <td className="font-mono py-2.5 pr-3 text-2xs text-ink-3">
                      {item.created_at ? dateFmt.format(new Date(item.created_at)) : '–'}
                    </td>
                    <td className="py-2.5 pr-4 text-right sm:pr-6">
                      <DeleteButton onConfirm={() => handleDeleteRule(item.id)} />
                    </td>
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
