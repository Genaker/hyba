export type Locale = 'en' | 'es' | 'uk' | 'de';

/**
 * Supported UI languages — flag + native name, shown in the header language switcher
 * (LanguageSwitcher.tsx). Order here is display order. `flag` is a self-hosted SVG
 * path, NOT an emoji: Windows ships no flag-emoji glyphs (Segoe UI Emoji excludes
 * them by policy), so 🇬🇧-style regional-indicator pairs render as bare "GB" text
 * there — SVGs render identically on every platform.
 */
export const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '/media/flags/gb.svg' },
  { code: 'es', label: 'Español', flag: '/media/flags/es.svg' },
  { code: 'uk', label: 'Українська', flag: '/media/flags/ua.svg' },
  { code: 'de', label: 'Deutsch', flag: '/media/flags/de.svg' },
];

export const DEFAULT_LOCALE: Locale = 'en';

export function isLocale(value: string | undefined | null): value is Locale {
  return LOCALES.some((entry) => entry.code === value);
}
