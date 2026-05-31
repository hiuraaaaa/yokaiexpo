import { useState, useEffect } from 'react';
import { MMKV } from 'react-native-mmkv';
import { THEMES, Theme } from '@/constants';

const storage   = new MMKV({ id: 'claw-theme' });
const THEME_KEY = 'claw_theme';

let globalTheme: Theme              = THEMES[0];
let listeners: ((t: Theme) => void)[] = [];

const notifyListeners = (t: Theme) => listeners.forEach(fn => fn(t));

export const setGlobalTheme = (themeId: string): void => {
  const theme = THEMES.find(t => t.id === themeId) ?? THEMES[0];
  globalTheme = theme;
  storage.set(THEME_KEY, themeId); // synchronous — ga perlu await
  notifyListeners(theme);
};

export const loadSavedTheme = (): void => {
  try {
    const saved = storage.getString(THEME_KEY);
    if (saved) {
      const theme = THEMES.find(t => t.id === saved) ?? THEMES[0];
      globalTheme = theme;
      notifyListeners(theme);
    }
  } catch {}
};

export const useTheme = (): Theme => {
  const [theme, setTheme] = useState<Theme>(globalTheme);

  useEffect(() => {
    listeners.push(setTheme);
    setTheme(globalTheme);
    return () => {
      listeners = listeners.filter(fn => fn !== setTheme);
    };
  }, []);

  return theme;
};
