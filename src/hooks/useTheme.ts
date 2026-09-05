import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

function readSystem(): Theme {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function readStored(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    // Private browsing can throw on access rather than returning null.
    return null;
  }
}

/**
 * Resolves the active theme and writes it to `<html data-theme>`, which is what the light
 * palette in index.css keys off.
 *
 * Until the user picks a side, this tracks the OS and keeps tracking it — so someone whose
 * machine turns dark in the evening sees the app follow, without ever having asked. Choosing
 * explicitly stores that choice and stops the tracking, because at that point they've said
 * what they want.
 */
export function useTheme() {
  const [explicit, setExplicit] = useState<Theme | null>(readStored);
  const [system, setSystem] = useState<Theme>(readSystem);

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = (e: MediaQueryListEvent) => setSystem(e.matches ? 'light' : 'dark');
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const theme = explicit ?? system;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggle = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setExplicit(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Preference just won't survive the session; not worth failing the click over.
    }
  }, [theme]);

  return { theme, toggle };
}
