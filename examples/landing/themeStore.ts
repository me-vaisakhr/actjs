import { globalSignal } from 'actjs';

export type ThemeMode = 'dark' | 'light' | 'system';

export function resolveTheme(mode: ThemeMode): 'dark' | 'light' {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
}

export function applyTheme(mode: ThemeMode) {
  document.documentElement.dataset.theme = resolveTheme(mode);
  document.documentElement.dataset.themeMode = mode;
  localStorage.setItem('actjs-theme', mode);
}

export const [themeMode, setThemeMode] = globalSignal<ThemeMode>(
  'theme-mode',
  (document.documentElement.dataset.themeMode as ThemeMode) || 'system',
);
