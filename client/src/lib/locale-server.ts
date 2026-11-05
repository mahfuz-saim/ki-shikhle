import { cookies } from 'next/headers';
import { type Locale, LOCALE_COOKIE, isLocale } from './i18n';

/**
 * The locale the **server** should render with.
 *
 * The locale used to live only in `localStorage`, which the server cannot read —
 * so `<html lang>` was hardcoded to `"en"` and every Bangla page was served to
 * the browser as an English document (wrong hyphenation, wrong screen-reader
 * pronunciation, wrong font selection).
 *
 * The client now mirrors the locale into a cookie, so the server can read it and
 * render the right `lang` on the first paint instead of correcting it after
 * hydration.
 *
 * This module imports `next/headers` and must only be used from a server
 * component.
 */
export function readLocaleFromCookie(): Locale {
  try {
    const saved = cookies().get(LOCALE_COOKIE)?.value;
    if (isLocale(saved)) return saved;
  } catch {
    // `cookies()` throws outside a request scope (e.g. during static generation
    // of a prerendered page). The default is a safe fallback.
  }
  return 'en';
}
