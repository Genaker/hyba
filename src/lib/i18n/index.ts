import 'server-only';
import { cookies } from 'next/headers';
import { isLocale, DEFAULT_LOCALE, type Locale } from './locales';
import en from './dictionaries/en';
import es from './dictionaries/es';
import uk from './dictionaries/uk';
import de from './dictionaries/de';

export type { Locale } from './locales';
export type { Dictionary } from './dictionaries/en';
export { LOCALES, DEFAULT_LOCALE, isLocale } from './locales';

const dictionaries = { en, es, uk, de };

export const localeCookieName = 'locale';

/**
 * The visitor's selected UI language — from the `locale` cookie (set by
 * LanguageSwitcher.tsx's setLocaleAction), falling back to English. This is UI-chrome
 * language only (labels, buttons); it's unrelated to the catalog/store the DataProvider
 * serves — see README "Internationalization" for the split and how a live provider can
 * read this same cookie for store/locale-aware requests.
 */
export async function getLocale(): Promise<Locale> {
  const cookieValue = (await cookies()).get(localeCookieName)?.value;
  return isLocale(cookieValue) ? cookieValue : DEFAULT_LOCALE;
}

export async function getDictionary() {
  return dictionaries[await getLocale()];
}
