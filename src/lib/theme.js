import { useEffect, useState } from 'react';

// Tercih: 'light' | 'dark' | 'system'. index.html'deki satir ici betik ilk boyamadan
// once ayni anahtari okur; boylece sayfa acilirken tema yanip sonmez.
const KEY = 'mihenk.theme';
const media = () => window.matchMedia('(prefers-color-scheme: dark)');

function readPref() {
  try {
    const raw = window.localStorage.getItem(KEY);
    const value = raw ? JSON.parse(raw) : 'system';
    return ['light', 'dark', 'system'].includes(value) ? value : 'system';
  } catch {
    return 'system';
  }
}

function apply(pref) {
  const dark = pref === 'dark' || (pref === 'system' && media().matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}

export function useTheme() {
  const [pref, setPref] = useState(readPref);

  useEffect(() => {
    apply(pref);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(pref));
    } catch {
      /* depolama engelli olabilir */
    }
    if (pref !== 'system') return undefined;
    const mq = media();
    const onChange = () => apply('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [pref]);

  return [pref, setPref];
}
