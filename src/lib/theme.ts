/**
 * Hell/Dunkel ist eine Einstellung pro Gerät und liegt deshalb in localStorage
 * (synchron lesbar, kein Aufblitzen beim Start). Siehe auch das Skript in index.html.
 */
export type ThemePref = 'system' | 'light' | 'dark';

const KEY = 'theme';
const media = () => window.matchMedia('(prefers-color-scheme: dark)');

export function getThemePref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

export function applyTheme(pref: ThemePref = getThemePref()): void {
  const dark = pref === 'dark' || (pref === 'system' && media().matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  // Statusleiste passend zur gewählten Darstellung, auch wenn sie vom System abweicht
  for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    meta.content = dark ? '#260600' : '#F4DCC6';
  }
}

export function setThemePref(pref: ThemePref): void {
  try {
    localStorage.setItem(KEY, pref);
  } catch {
    // privater Modus o. Ä. – gilt dann nur bis zum Neuladen
  }
  applyTheme(pref);
}

/** Folgt der Systemeinstellung, solange „System“ gewählt ist. */
export function watchSystemTheme(): () => void {
  const m = media();
  const onChange = () => getThemePref() === 'system' && applyTheme('system');
  m.addEventListener('change', onChange);
  return () => m.removeEventListener('change', onChange);
}
