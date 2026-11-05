'use client';

import { useEffect } from 'react';
import { useI18n } from '@/lib/i18n-context';

/**
 * Keeps `<html lang>` in sync with the active locale.
 *
 * The root layout is a server component and the locale lives in `localStorage`,
 * so the server can only render a sensible default (`"en"`). This client
 * component corrects the attribute on mount — and on every change — so a
 * Bangla user's document no longer claims to be English (wrong hyphenation,
 * wrong screen-reader pronunciation).
 *
 * The locale comes from `useI18n()` rather than from `localStorage`. Reading
 * `localStorage` here was wrong twice over: the `storage` event does **not** fire
 * in the tab that made the change, so the attribute only corrected itself when
 * the window regained focus; and the component was a second, independent source
 * of truth for the same piece of state.
 */
export function LocaleLang() {
  const { locale } = useI18n();

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const next = locale === 'bn' ? 'bn' : 'en';
    if (document.documentElement.lang !== next) {
      document.documentElement.lang = next;
    }
  }, [locale]);

  return null;
}

export default LocaleLang;
