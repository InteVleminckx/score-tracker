import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import en from './en.json';
import nl from './nl.json';

export type Locale = 'en' | 'nl';

const translations: Record<Locale, Record<string, string>> = { en, nl };
const LOCALE_KEY = 'yin:locale';

type TranslateParams = Record<string, string | number>;

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: TranslateParams) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function detectDefaultLocale(): Locale {
  const stored = localStorage.getItem(LOCALE_KEY);
  if (stored === 'en' || stored === 'nl') return stored;
  return 'nl';
}

function interpolate(template: string, params?: TranslateParams): string {
  if (!params) return template;
  return template.replace(/{{(\w+)}}/g, (match, key) =>
    key in params ? String(params[key]) : match,
  );
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectDefaultLocale);

  const setLocale = (next: Locale) => {
    localStorage.setItem(LOCALE_KEY, next);
    setLocaleState(next);
  };

  const t = useMemo(() => {
    const dict = translations[locale];
    return (key: string, params?: TranslateParams) => interpolate(dict[key] ?? key, params);
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within an I18nProvider');
  return ctx;
}
