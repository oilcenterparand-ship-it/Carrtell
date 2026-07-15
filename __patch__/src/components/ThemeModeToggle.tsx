import { useEffect, useMemo, useState } from 'react';
import { CARRTELL_USER_THEME_MODE_KEY, type UserThemeMode } from '../lib/appearanceThemes';

const labels: Record<UserThemeMode, string> = {
  light: 'روشن',
  dark: 'تاریک',
  system: 'سیستم'
};

const icons: Record<UserThemeMode, string> = {
  light: '☀️',
  dark: '🌙',
  system: '◐'
};

function getInitialMode(): UserThemeMode {
  if (typeof localStorage === 'undefined') return 'system';
  const saved = localStorage.getItem(CARRTELL_USER_THEME_MODE_KEY) as UserThemeMode | null;
  return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
}

function applyMode(mode: UserThemeMode) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.ctUserMode = mode;
  if (mode === 'system') {
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    root.dataset.ctResolvedMode = prefersDark ? 'dark' : 'light';
  } else {
    root.dataset.ctResolvedMode = mode;
  }
}

export default function ThemeModeToggle() {
  const [mode, setMode] = useState<UserThemeMode>(getInitialMode);
  const nextMode = useMemo<UserThemeMode>(() => {
    if (mode === 'system') return 'light';
    if (mode === 'light') return 'dark';
    return 'system';
  }, [mode]);

  useEffect(() => {
    localStorage.setItem(CARRTELL_USER_THEME_MODE_KEY, mode);
    applyMode(mode);
  }, [mode]);

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    const handler = () => applyMode(mode);
    media?.addEventListener?.('change', handler);
    return () => media?.removeEventListener?.('change', handler);
  }, [mode]);

  return (
    <button
      type="button"
      onClick={() => setMode(nextMode)}
      className="ct-theme-mode-toggle"
      title={`حالت فعلی: ${labels[mode]}`}
      aria-label="تغییر حالت روشن و تاریک سایت"
    >
      <span>{icons[mode]}</span>
      <small>{labels[mode]}</small>
    </button>
  );
}
