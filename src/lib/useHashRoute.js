import { useEffect, useState } from 'react';

export const ROUTES = {
  analysis: '#/analiz',
  rules: '#/kurallar',
  catalog: '#/katalog',
};

const current = () => {
  const hash = window.location.hash;
  if (hash === ROUTES.rules) return 'rules';
  if (hash === ROUTES.catalog) return 'catalog';
  return 'analysis';
};

export function useHashRoute() {
  const [route, setRoute] = useState(current);

  useEffect(() => {
    const onChange = () => setRoute(current());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return route;
}
