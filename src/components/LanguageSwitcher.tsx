import { headers } from 'next/headers';
import { setLocaleAction } from '@/lib/actions';
import { LOCALES, getLocale } from '@/lib/i18n';

/**
 * Header language switcher — native <details> dropdown (same zero-JS-friendly pattern as
 * MiniCart.tsx), one small server-action form per language. Works with zero client JS: each
 * option is a real form POST that sets the `locale` cookie and redirects back to the current
 * page (see setLocaleAction in lib/actions.ts).
 */
export default async function LanguageSwitcher() {
  const [activeLocale, pathname] = await Promise.all([getLocale(), headers().then((h) => h.get('x-pathname') ?? '/')]);
  const active = LOCALES.find((entry) => entry.code === activeLocale) ?? LOCALES[0];

  return (
    <details className="language-switcher relative">
      <summary
        className="language-switcher-toggle flex cursor-pointer list-none items-center gap-1 font-medium hover:text-brand-600 [&::-webkit-details-marker]:hidden"
        aria-label="Language"
      >
        <img aria-hidden alt="" src={active.flag} width={20} height={14} className="language-switcher-flag h-3.5 w-5 rounded-[2px] object-cover" />
        <span className="language-switcher-code hidden sm:inline">{active.code.toUpperCase()}</span>
        <span aria-hidden className="language-switcher-icon text-xs text-gray-400">▾</span>
      </summary>

      <ul className="language-switcher-list absolute right-0 top-full z-30 mt-2 w-44 rounded-xl border border-mist bg-paper p-1.5 shadow-xl">
        {LOCALES.map((entry) => (
          <li key={entry.code} className="language-switcher-item">
            <form action={setLocaleAction} className="language-switcher-form">
              <input type="hidden" name="locale" value={entry.code} />
              <input type="hidden" name="back" value={pathname} />
              <button
                type="submit"
                aria-current={entry.code === activeLocale ? 'true' : undefined}
                className={`language-switcher-option flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-mist ${
                  entry.code === activeLocale ? 'font-semibold text-brand-600' : ''
                }`}
              >
                {/* lazy: the dropdown is closed on load — eager flags cost a
                    preload + request on every page and compete with the LCP */}
                <img aria-hidden alt="" loading="lazy" src={entry.flag} width={20} height={14} className="language-switcher-flag h-3.5 w-5 rounded-[2px] object-cover" />
                {entry.label}
              </button>
            </form>
          </li>
        ))}
      </ul>
    </details>
  );
}
