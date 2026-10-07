// Tarayiciya ozel kucuk kolayliklar. Okuma/yazma her zaman sessizce basarisiz olabilir.
const RECENT_KEY = 'mihenk.recent';
const TLP_KEY = 'mihenk.tlp';
const RECENT_LIMIT = 8;

function read(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ozel pencere veya engellenmis depolama */
  }
}

export const loadRecent = () => {
  const list = read(RECENT_KEY, []);
  return Array.isArray(list) ? list : [];
};

export function pushRecent(entry) {
  const next = [entry, ...loadRecent().filter((e) => e.query !== entry.query)].slice(0, RECENT_LIMIT);
  write(RECENT_KEY, next);
  return next;
}

export function clearRecent() {
  write(RECENT_KEY, []);
  return [];
}

export const loadTlp = () => read(TLP_KEY, 'amber');
export const saveTlp = (value) => write(TLP_KEY, value);
