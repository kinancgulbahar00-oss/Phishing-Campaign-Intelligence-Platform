import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Trash2, Plus, X, Search, AlertCircle } from 'lucide-react';
import { fetchLists, addListItem, deleteListItem } from '../api/client';

export function ListManagementModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('whitelist'); // 'whitelist' veya 'blacklist'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [pattern, setPattern] = useState('');
  const [entryType, setEntryType] = useState('domain');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchLists(activeTab);
      setItems(data);
    } catch (err) {
      setError(err.message || 'Veriler yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, activeTab]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!pattern.trim()) return;

    setSubmitting(true);
    setError('');
    try {
      await addListItem({
        list_type: activeTab,
        entry_type: entryType,
        pattern: pattern.trim(),
        description: description.trim() || undefined,
      });
      setPattern('');
      setDescription('');
      await loadData();
    } catch (err) {
      setError(err.message || 'Kural eklenirken hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteListItem(id);
      setItems(items.filter((item) => item.id !== id));
    } catch (err) {
      setError(err.message || 'Kural silinemedi.');
    }
  };

  if (!isOpen) return null;

  const filteredItems = items.filter((item) =>
    item.pattern.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-panel border border-line bg-surface shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2 text-brand-400 border border-line">
              {activeTab === 'whitelist' ? (
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
              ) : (
                <ShieldAlert className="h-5 w-5 text-rose-400" />
              )}
            </div>
            <div>
              <h2 className="text-base font-semibold text-ink">Liste Yönetimi (Whitelist & Blacklist)</h2>
              <p className="text-xs text-ink-3">Güvenli veya zararlı alan adı, IP ve URL kurallarını özelleştirin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-ink-3 hover:bg-surface-2 hover:text-ink transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-line bg-surface-2/50 px-6">
          <button
            onClick={() => setActiveTab('whitelist')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition-colors ${
              activeTab === 'whitelist'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-ink-3 hover:text-ink'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            Güvenli Liste (Whitelist)
          </button>
          <button
            onClick={() => setActiveTab('blacklist')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition-colors ${
              activeTab === 'blacklist'
                ? 'border-rose-400 text-rose-400'
                : 'border-transparent text-ink-3 hover:text-ink'
            }`}
          >
            <ShieldAlert className="h-4 w-4" />
            Zararlı Liste (Blacklist)
          </button>
        </div>

        {/* Body Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {error && (
            <div className="flex items-center gap-2.5 rounded-lg border border-risk-critical/40 bg-risk-critical/10 p-3 text-xs text-risk-critical">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Add New Entry Form */}
          <form onSubmit={handleAdd} className="rounded-xl border border-line bg-surface-2/40 p-4 space-y-3">
            <h3 className="text-xs font-semibold text-ink uppercase tracking-wider">
              {activeTab === 'whitelist' ? 'Yeni Güvenli Kural Ekle' : 'Yeni Zararlı Kural Ekle'}
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <select
                value={entryType}
                onChange={(e) => setEntryType(e.target.value)}
                className="rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink focus:border-brand-400 focus:outline-none"
              >
                <option value="domain">Domain (Alan Adı)</option>
                <option value="ip">IP Adresi</option>
                <option value="url">Tam URL</option>
              </select>
              <input
                type="text"
                placeholder={entryType === 'domain' ? 'örn: google.com' : entryType === 'ip' ? 'örn: 1.1.1.1' : 'örn: https://phish.com'}
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                required
                className="col-span-2 rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink placeholder:text-ink-3 focus:border-brand-400 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Açıklama / Gerekçe (isteğe bağlı)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink placeholder:text-ink-3 focus:border-brand-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={submitting || !pattern.trim()}
                className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-canvas transition-colors ${
                  activeTab === 'whitelist'
                    ? 'bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50'
                    : 'bg-rose-500 hover:bg-rose-400 disabled:opacity-50'
                }`}
              >
                <Plus className="h-3.5 w-3.5" />
                Ekle
              </button>
            </div>
          </form>

          {/* Search & Filter Header */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-ink-3" />
              <input
                type="text"
                placeholder="Kurallar içinde ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-line bg-surface-2/60 pl-9 pr-3 py-1.5 text-xs text-ink placeholder:text-ink-3 focus:border-brand-400 focus:outline-none"
              />
            </div>
            <span className="text-xs text-ink-3">Toplam: {filteredItems.length} kayıt</span>
          </div>

          {/* List Table */}
          {loading ? (
            <div className="py-8 text-center text-xs text-ink-3">Kurallar yükleniyor...</div>
          ) : filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-ink-3">
              Bu listede henüz kayıt bulunmuyor.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-line bg-surface">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-line bg-surface-2/80 text-ink-3 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-2.5">Tür</th>
                    <th className="px-4 py-2.5">Pattern (Kalıp)</th>
                    <th className="px-4 py-2.5">Açıklama</th>
                    <th className="px-4 py-2.5 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/50 text-ink">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-2/40 transition-colors">
                      <td className="px-4 py-3">
                        <span className="rounded bg-surface-2 px-2 py-0.5 text-[10px] font-semibold text-ink-2 uppercase">
                          {item.entry_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-medium text-ink">{item.pattern}</td>
                      <td className="px-4 py-3 text-ink-3">{item.description || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDelete(item.id)}
                          title="Kuralı Sil"
                          className="rounded p-1.5 text-ink-3 hover:bg-risk-critical/20 hover:text-risk-critical transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-line bg-surface-2/50 px-6 py-3 text-right">
          <button
            onClick={onClose}
            className="rounded-lg border border-line bg-surface px-4 py-1.5 text-xs font-medium text-ink hover:bg-surface-2 transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
