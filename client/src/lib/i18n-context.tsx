'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import enMessages from '@/messages/en.json';
import bnMessages from '@/messages/bn.json';
import { type Locale, LOCALE_STORAGE_KEY, isLocale } from './i18n';

interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  toggleLocale: () => void;
  /**
   * Look up a message and interpolate it.
   *
   * `t('quiz.count', { count: 5 })` replaces `{count}` in the message with `5`.
   * Without this, every count, name and total in the app had to be written as a
   * hand-built `isBn ? ... : ...` pair, which is where the untranslated strings
   * came from.
   */
  t: (path: string, fallbackOrVars?: string | Record<string, string | number>, fallback?: string) => string;
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
  t: (path: string, fallbackOrVars?: string | Record<string, string | number>, fallback?: string) =>
    (typeof fallbackOrVars === 'string' ? fallbackOrVars : fallback) || path,
  isBn: false,
});

/**
 * Replace `{name}` placeholders with their values.
 *
 * A placeholder with no matching value is left as it is, so a missing variable
 * shows up in the UI rather than silently blanking part of a sentence.
 */
function interpolate(
  message: string,
  vars?: Record<string, string | number>
): string {
  if (!vars) return message;
  return message.replace(/\{(\w+)\}/g, (whole, name: string) => {
    const value = vars[name];
    return value === undefined || value === null ? whole : String(value);
  });
}

/**
 * Read the stored locale **synchronously** during the first render.
 *
 * The old code started at `'en'` and only read `ki_locale` in an effect, so a
 * Bangla user saw a full frame of English on every page load — and the
 * server-rendered `<html lang>` was always `"en"`.
 */
function readStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(saved)) return saved;
  } catch {
    // localStorage can throw in private mode / sandboxed iframes.
  }
  return 'en';
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readStoredLocale);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCALE_STORAGE_KEY, l);
      } catch {
        // localStorage can throw in private mode / sandboxed iframes.
      }
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'en' ? 'bn' : 'en');
  }, [locale, setLocale]);

  const t = useCallback(
    (
      path: string,
      fallbackOrVars?: string | Record<string, string | number>,
      fallback?: string
    ): string => {
      // Two call shapes:
      //   t('a.b', 'fallback text')
      //   t('a.b', { name: 'Rahim' }, 'fallback text')
      const vars =
        fallbackOrVars && typeof fallbackOrVars === 'object' ? fallbackOrVars : undefined;
      const fallbackText =
        typeof fallbackOrVars === 'string' ? fallbackOrVars : fallback;

      const keys = path.split('.');
      let current = dictionaries[locale];
      for (const k of keys) {
        if (current && typeof current === 'object' && k in current) {
          current = current[k];
        } else {
          return interpolate(fallbackText || path, vars);
        }
      }
      return interpolate(
        typeof current === 'string' ? current : fallbackText || path,
        vars
      );
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
