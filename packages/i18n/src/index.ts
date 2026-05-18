import de from './messages/de.json';
import it from './messages/it.json';
import en from './messages/en.json';

/**
 * Supported locales. German is primary (initial market: South Tyrol),
 * Italian and English are first-class. Ladin (lld) is a planned addition.
 */
export const LOCALES = ['de', 'it', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'de';

export type Messages = typeof de;

const catalogs: Record<Locale, Messages> = { de, it, en };

export function getMessages(locale: Locale): Messages {
  return catalogs[locale] ?? catalogs.de;
}

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function resolveLocale(input: string | undefined | null): Locale {
  if (input && isLocale(input)) return input;
  return DEFAULT_LOCALE;
}
