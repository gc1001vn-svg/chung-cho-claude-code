import en from '../locales/en.json';
import vi from '../locales/vi.json';

export type Locale = 'vi' | 'en';

export type Dictionary = Readonly<Record<string, string>>;
export type Dictionaries = Readonly<Record<Locale, Dictionary>>;

export const DICTIONARIES: Dictionaries = { vi, en };

export const DEFAULT_LOCALE: Locale = 'vi';
export const FALLBACK_LOCALE: Locale = 'en';

const PARAM_PATTERN = /\{(\w+)\}/g;

export type Params = Readonly<Record<string, string | number>>;

/**
 * Pure lookup, kept free of module state so it can be tested against synthetic
 * dictionaries (CLAUDE.md §6 keeps logic separate from the Phaser layer).
 *
 * Resolution order is active locale, then the fallback locale, then the key
 * itself. Returning the key rather than an empty string means a missing
 * translation shows up on screen as `status.heading` instead of a blank gap.
 */
export function translate(
  dictionaries: Dictionaries,
  locale: Locale,
  key: string,
  params?: Params,
): string {
  const template = dictionaries[locale][key] ?? dictionaries[FALLBACK_LOCALE][key] ?? key;
  if (!params) return template;

  // An unknown placeholder is left verbatim so the gap is visible rather than
  // being swallowed into an empty string.
  return template.replace(PARAM_PATTERN, (whole, name: string) =>
    name in params ? String(params[name]) : whole,
  );
}

let activeLocale: Locale = DEFAULT_LOCALE;

export function getLocale(): Locale {
  return activeLocale;
}

export function setLocale(locale: Locale): void {
  activeLocale = locale;
}

/** Translate a key using the active locale and the bundled dictionaries. */
export function t(key: string, params?: Params): string {
  return translate(DICTIONARIES, activeLocale, key, params);
}
