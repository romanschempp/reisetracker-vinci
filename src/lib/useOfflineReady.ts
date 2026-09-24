import { useEffect, useState } from 'react';

/**
 * ready       – die App ist komplett gespeichert und startet ohne Internet
 * preparing   – der Service Worker lädt noch (App mit Internet offen lassen)
 * unsupported – kein Service Worker (z. B. Entwicklungsserver oder http://)
 */
export type OfflineState = 'checking' | 'ready' | 'preparing' | 'unsupported';

async function check(): Promise<OfflineState> {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator) || !window.isSecureContext) return 'unsupported';
  if (!navigator.serviceWorker.controller) return 'preparing';
  const shell = await caches.match(new URL('index.html', location.href).href, { ignoreSearch: true });
  return shell ? 'ready' : 'preparing';
}

export function useOfflineReady(): OfflineState {
  const [state, setState] = useState<OfflineState>('checking');

  useEffect(() => {
    let alive = true;
    let timer: number | undefined;
    const run = async () => {
      const next = await check().catch((): OfflineState => 'preparing');
      if (!alive) return;
      setState(next);
      // So lange nachsehen, bis alles im Speicher liegt
      if (next === 'preparing') timer = window.setTimeout(run, 2000);
    };
    void run();
    navigator.serviceWorker?.addEventListener('controllerchange', run);
    return () => {
      alive = false;
      window.clearTimeout(timer);
      navigator.serviceWorker?.removeEventListener('controllerchange', run);
    };
  }, []);

  return state;
}
