/**
 * The locale catalogue.
 *
 * This file used to be dead code — `i18n-context.tsx` declared its own local
 * `type Locale = 'en' | 'bn'` and nothing imported this module. The type now
 * lives here, in one place, and the context imports it.
 */
export const locales = ['en', 'bn'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

/** The `localStorage` key the chosen locale is stored under. */
export const LOCALE_STORAGE_KEY = 'ki_locale';

/**
 * The cookie the chosen locale is mirrored into.
 *
 * `localStorage` is invisible to the server, so `<html lang>` could only ever be
 * corrected after hydration. The cookie gives the server the same information,
 * so the very first paint already declares the right language.
 */
export const LOCALE_COOKIE = 'ki_locale';

/** Is this a locale the app knows about? */
export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}
