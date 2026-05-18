import { getMessages, resolveLocale, DEFAULT_LOCALE, type Locale } from '@vesta/i18n';

export { DEFAULT_LOCALE };
export type { Locale };

/** Resolve a locale from an Accept-Language-ish value and load its catalog. */
export function loadCatalog(localeInput?: string | null) {
  const locale = resolveLocale(localeInput);
  return { locale, t: getMessages(locale) };
}
