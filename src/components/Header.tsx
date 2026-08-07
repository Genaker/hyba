import Link from 'next/link';
import Image from 'next/image';
import { getSessionUser } from '@/lib/session';
import { storefrontConfig } from '@/lib/config';
import { getDictionary } from '@/lib/i18n';
import { buildCustomerSections } from '@/lib/hyva/section-data';
import { jsonForAttribute } from '@/lib/hyva/inline';
import MegaMenu from './MegaMenu';
import LanguageSwitcher from './LanguageSwitcher';
import InlineScript from './hyba/InlineScript';
import CartDrawer from './hyba/CartDrawer';
import MiniSearch from './hyba/MiniSearch';
import { initHeaderSource } from './hyba/scripts/header';

export default async function Header() {
  const [user, dictionary, sections] = await Promise.all([getSessionUser(), getDictionary(), buildCustomerSections()]);
  const { header, miniCart, wishlist, compare, cart } = dictionary;
  const { logoUrl, logoAlt, name } = storefrontConfig.site;

  return (
    <header className="page-header border-b border-mist bg-paper">
      <p className="header-notice bg-brand-700 py-1.5 text-center text-xs font-medium tracking-wide text-white">
        {header.freeShipping}
      </p>

      <div
        x-data={`initHeader(${jsonForAttribute({ wishlistCount: sections.wishlist.count, compareCount: sections.compare.count })})`}
        className="header-content mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-4 sm:flex-nowrap sm:gap-8"
      >
        <Link href="/" className="logo shrink-0" aria-label={`${name} — home`}>
          <Image src={logoUrl} alt={logoAlt} width={142} height={44} className="logo-image" />
        </Link>

        <nav aria-label="Account and cart" className="header-links ml-auto flex shrink-0 items-center gap-5 text-sm sm:order-none sm:ml-0">
          <Link href="/quick-order" className="header-link hidden hover:text-brand-600 sm:inline">{header.quickOrder}</Link>
          {user ? (
            <Link href="/account" className="header-link hover:text-brand-600">
              <span className="header-link-label hidden sm:inline">{header.hiGreeting(user.firstName)}</span>
              <span className="header-link-label sm:hidden">{header.account}</span>
            </Link>
          ) : (
            <Link href="/login" className="header-link hover:text-brand-600">{header.signIn}</Link>
          )}

          <Link href="/compare" x-show="compareCount > 0" x-cloak className="header-link compare-header-link relative flex items-center gap-1 hover:text-brand-600" aria-label={compare.ariaLabel(sections.compare.count)}>
            <span aria-hidden className="compare-header-link-icon text-base">⇄</span>
            <span className="header-link-label hidden sm:inline">{header.compare}</span>
            <span x-text="compareCount" className="compare-header-link-count absolute -right-3 -top-2 rounded-full bg-accent px-1.5 text-xs font-bold text-white">
              {sections.compare.count}
            </span>
          </Link>

          <Link href="/wishlist" className="header-link wishlist-header-link relative flex items-center gap-1 hover:text-brand-600" aria-label={wishlist.ariaLabel(sections.wishlist.count)}>
            <span aria-hidden className="wishlist-header-link-icon text-base">♡</span>
            <span className="header-link-label hidden sm:inline">{header.wishlist}</span>
            <span x-show="wishlistCount > 0" x-cloak x-text="wishlistCount" className="wishlist-header-link-count absolute -right-3 -top-2 rounded-full bg-accent px-1.5 text-xs font-bold text-white">
              {sections.wishlist.count > 0 ? sections.wishlist.count : ''}
            </span>
          </Link>

          <LanguageSwitcher />

          <CartDrawer
            initialCart={sections.cart}
            labels={{
              cartLabel: miniCart.cartLabel,
              empty: miniCart.empty,
              subtotal: miniCart.subtotal,
              viewCart: miniCart.viewCart,
              checkout: miniCart.checkout,
              remove: cart.remove,
              quantity: cart.qty,
            }}
          />
        </nav>

        <MiniSearch searchLabel={header.searchLabel} placeholder={header.searchPlaceholder} submitLabel={header.search} />

        <InlineScript code={initHeaderSource} />
      </div>

      <MegaMenu />
    </header>
  );
}
