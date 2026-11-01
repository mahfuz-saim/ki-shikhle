'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import enMessages from '@/messages/en.json';
import bnMessages from '@/messages/bn.json';

type Locale = 'en' | 'bn';

interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  toggleLocale: () => void;
  t: (path: string, fallback?: string) => string;
  isBn: boolean;
}

const dictionaries: Record<Locale, any> = {
  en: enMessages,
  bn: bnMessages,
};

const I18nContext = createContext<I18nContextType>({
  locale: 'en',
  setLocale: () => {},
  toggleLocale: () => {},
  t: (path: string, fallback?: string) => fallback || path,
  isBn: false,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ki_locale') as Locale;
      if (saved === 'en' || saved === 'bn') {
        setLocaleState(saved);
      }
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ki_locale', l);
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'en' ? 'bn' : 'en');
  }, [locale, setLocale]);

  const t = useCallback(
    (path: string, fallback?: string): string => {
      const keys = path.split('.');
      let current = dictionaries[locale];
      for (const k of keys) {
        if (current && typeof current === 'object' && k in current) {
          current = current[k];
        } else {
          return fallback || path;
        }
      }
      return typeof current === 'string' ? current : fallback || path;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, toggleLocale, t, isBn: locale === 'bn' }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
