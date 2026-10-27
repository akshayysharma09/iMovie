import { useEffect, useState, useCallback } from 'react';

export interface RouteState {
  path: string;
  params: Record<string, string>;
}

function parseHash(): RouteState {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  return { path: raw, params: {} };
}

export function useRouter() {
  const [route, setRoute] = useState<RouteState>(parseHash);

  useEffect(() => {
    const onHash = () => {
      setRoute(parseHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = useCallback((to: string) => {
    if (to.startsWith('#')) to = to.slice(1);
    window.location.hash = to;
  }, []);

  return { route, navigate };
}

// Match helpers
export function matchRoute(path: string, pattern: string): Record<string, string> | null {
  const pParts = pattern.split('/').filter(Boolean);
  const aParts = path.split('/').filter(Boolean);
  if (pParts.length !== aParts.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < pParts.length; i++) {
    if (pParts[i].startsWith(':')) {
      params[pParts[i].slice(1)] = decodeURIComponent(aParts[i]);
    } else if (pParts[i] !== aParts[i]) {
      return null;
    }
  }
  return params;
}
