import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Locale, LocalizedText } from '../config/site';
import { TranslationDict } from './types';
import { fr } from './fr';
import { en } from './en';
import { ar } from './ar';

const DICTS: Record<Locale, TranslationDict> = { fr, en, ar };

export type ThemeMode = 'light' | 'dark';

interface I18nContextValue {
  locale: Locale;
  setLocale: (loc: Locale) => void;
  isRtl: boolean;
  t: TranslationDict;
  pick: (text: LocalizedText) => string;
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const LOCALE_STORAGE_KEY = 'ch_locale';
const THEME_STORAGE_KEY = 'ch_theme';
const SOUND_STORAGE_KEY = 'ch_sound';

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    try {
      const saved = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
      if (saved === 'fr' || saved === 'en' || saved === 'ar') return saved;
    } catch {
      // ignore storage access error
    }
    return 'fr';
  });

  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // ignore
    }
    return 'light';
  });

  const [soundEnabled, setSoundState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SOUND_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const isRtl = locale === 'ar';

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      // ignore
    }
  }, [locale, isRtl]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const setLocale = (loc: Locale) => setLocaleState(loc);
  const setTheme = (mode: ThemeMode) => setThemeState(mode);
  const toggleTheme = () => setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  const setSoundEnabled = (enabled: boolean) => {
    setSoundState(enabled);
    try {
      localStorage.setItem(SOUND_STORAGE_KEY, String(enabled));
    } catch {
      // ignore
    }
  };

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      isRtl,
      t: DICTS[locale],
      pick: (text: LocalizedText) => text[locale] ?? text.fr,
      theme,
      setTheme,
      toggleTheme,
      soundEnabled,
      setSoundEnabled,
    }),
    [locale, isRtl, theme, soundEnabled]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
