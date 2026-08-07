import Link from 'next/link';
import Image from 'next/image';
import { provider } from '@/lib/provider';
import { getDictionary } from '@/lib/i18n';
import type { MenuItem } from '@/lib/types';

// Tiny inline SVG icons keyed by the provider's icon names — no icon library.
const iconPaths: Record<string, React.ReactNode> = {
  bulb: <path d="M10 2a5.5 5.5 0 0 0-3 10.1c.6.4 1 1 1 1.7v.7h4v-.7c0-.7.4-1.3 1-1.7A5.5 5.5 0 0 0 10 2Zm-1.5 15h3M9 19.5h2" />,
  cross: <path d="M8 3h4v5h5v4h-5v5H8v-5H3V8h5V3Z" />,
  chair: <path d="M5 10V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v6M4 10h12a1 1 0 0 1 1 1v2H3v-2a1 1 0 0 1 1-1Zm1 3v5m10-5v5" />,
  tag: <path d="M3 9V3h6l8 8-6 6-8-8Zm4-3h.01" />,
  star: <path d="M10 2.5 12.2 7l4.9.7-3.5 3.5.8 4.9-4.4-2.3-4.4 2.3.8-4.9L3 7.7 7.9 7 10 2.5Z" />,
  sparkle: <path d="M10 2v5m0 6v5m-8-8h5m6 0h5M5.5 5.5l2 2m5 5 2 2m0-9-2 2m-5 5-2 2" />,
};

function NavIcon({ name }: { name: string | null }) {
  const icon = name && iconPaths[name];
  if (!icon) return null;
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className="nav-icon h-4 w-4 shrink-0 stroke-current opacity-70"
      fill="none"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icon}
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="hamburger-icon h-5 w-5 stroke-current" fill="none" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 6h14M3 10h14M3 14h14" />
    </svg>
  );
}

function ChevronIcon({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={`chevron-icon h-4 w-4 shrink-0 stroke-current ${className}`} fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 8 4 4 4-4" />
    </svg>
  );
}

/** One panel column: bold heading, "Shop All", then the deeper links in gray. */
function MenuColumn({ item, shopAllLabel }: { item: MenuItem; shopAllLabel: string }) {
  const flattenedLinks = item.children.flatMap((child) => [child, ...child.children]);
  return (
    <div className="submenu-column min-w-44">
      <p className="submenu-title text-base font-semibold text-ink">{item.title}</p>
      <ul className="submenu-links mt-4 space-y-3">
        <li className="submenu-item">
          <Link href={item.url} className="submenu-link text-sm text-gray-500 hover:text-ink hover:underline">
            {shopAllLabel}
          </Link>
        </li>
        {flattenedLinks.map((link) => (
          <li key={link.url} className="submenu-item">
            <Link href={link.url} className="submenu-link text-sm text-gray-500 hover:text-ink hover:underline">
              {link.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Catalog navigation — all items come from the data provider (getMenu).
 * Desktop (lg+): horizontal bar, full-width mega panels open on hover/focus.
 * Mobile: collapses behind a hamburger toggle — a plain checkbox + label
 * (the same zero-JS-safe pattern as MiniCart's <details>), expanding to a
 * stacked list of top-level links. No overflow-x-auto anywhere: a wide flex
 * row combined with justify-center and overflow-x-auto is a known CSS trap
 * (overflow bleeds both directions instead of scrolling cleanly), which is
 * what previously dragged the whole page into horizontal scroll on mobile.
 *
 * Subcategories on mobile: the desktop panel only opens on :hover, which
 * doesn't exist on touch, so each item with children gets its own mobile
 * row where the category Link, a checkbox+label chevron toggle, and the
 * subcategory <ul> are all direct siblings (checkbox-hack, same pattern as
 * the outer hamburger) — never nested inside each other. That matters:
 * an earlier version nested the Link inside a <details><summary>, and
 * clicking it toggled the disclosure instead of navigating — browsers
 * don't reliably let a nested interactive element win over <summary>'s own
 * click handling. Siblings have no such ambiguity. Desktop keeps the
 * existing hover-panel row, rendered separately and hidden below lg: so
 * the two never interact.
 */
export default async function MegaMenu() {
  const [menu, { nav }] = await Promise.all([provider.getMenu(), getDictionary()]);

  return (
    <nav aria-label="Catalog" className="navigation relative border-b border-t border-mist bg-paper">
      <div className="navigation-content mx-auto max-w-7xl px-4">
        <input type="checkbox" id="catalog-menu-toggle" className="mobile-nav-checkbox peer hidden" />
        <label
          htmlFor="catalog-menu-toggle"
          className="mobile-nav-toggle flex cursor-pointer items-center gap-2 py-3 text-sm font-medium text-ink lg:hidden"
        >
          <HamburgerIcon />
          {nav.shopCategories}
        </label>

        <ul className="nav-items hidden flex-col gap-1 pb-3 peer-checked:flex lg:flex lg:flex-row lg:justify-center lg:gap-2 lg:pb-0">
          {menu.map((item) => {
            const hasPanel = item.children.length > 0;
            const isMega = item.children.some((child) => child.children.length > 0);
            const mobileToggleId = `mobile-sub-${item.url.replace(/\W+/g, '-')}`;
            return (
              // no `relative` here on purpose — the panel below is `absolute inset-x-0`
              // and must size against the full-width <nav> (already `relative`), not
              // this narrow nav-item <li>; `group` (hover-scope marker) is independent
              // of positioning and stays put.
              <li key={item.url} className="nav-item group">
                {/* Mobile row (lg:hidden): nested accordion when there are subcategories to reach. */}
                {hasPanel ? (
                  // Link, toggle checkbox, chevron label and the subcategory <ul> are all
                  // direct siblings (flex-wrap row) — NOT nested inside each other — so
                  // clicking the Link always navigates and clicking the chevron always
                  // toggles, with no ambiguity. (An earlier <details><summary><Link> version
                  // failed: clicking a Link nested inside <summary> toggled instead of
                  // navigating — browsers don't reliably let it win over the disclosure.)
                  <div className="nav-item-mobile flex flex-wrap items-center lg:hidden">
                    <Link
                      href={item.url}
                      className="nav-link flex flex-1 items-center gap-1.5 rounded-lg py-2.5 pl-3 text-[15px] font-medium text-ink hover:bg-mist"
                    >
                      <NavIcon name={item.icon} />
                      {item.title}
                    </Link>
                    <input type="checkbox" id={mobileToggleId} className="submenu-checkbox peer hidden" />
                    <label
                      htmlFor={mobileToggleId}
                      aria-label={`Show ${item.title} subcategories`}
                      className="submenu-toggle cursor-pointer rounded-lg p-2.5 transition-transform hover:bg-mist peer-checked:rotate-180"
                    >
                      <ChevronIcon />
                    </label>
                    <ul className="mobile-submenu order-last ml-4 hidden w-full space-y-0.5 border-l border-mist py-1 pl-3 peer-checked:block">
                      {item.children.flatMap((child) => [child, ...child.children]).map((link) => (
                        <li key={link.url} className="mobile-submenu-item">
                          <Link href={link.url} className="submenu-link block rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-mist hover:text-ink">
                            {link.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <Link
                    href={item.url}
                    className="nav-link flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-[15px] font-medium text-ink hover:bg-mist lg:hidden"
                  >
                    <NavIcon name={item.icon} />
                    {item.title}
                  </Link>
                )}

                {/* Desktop row (hidden below lg:) — full-width hover panel below. */}
                <Link
                  href={item.url}
                  className="nav-link hidden items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-3 py-3.5 text-[15px] font-medium text-ink transition-colors lg:flex lg:group-hover:border-ink lg:hover:text-black"
                >
                  <NavIcon name={item.icon} />
                  {item.title}
                  {/* dropdown affordance — only on items that actually open a panel */}
                  {hasPanel && <ChevronIcon className="nav-chevron opacity-60 transition-transform duration-150 lg:group-hover:rotate-180" />}
                </Link>

                {/* Mega/flyout panel — desktop only. */}
                {hasPanel && (
                  <div className="submenu invisible absolute inset-x-0 top-full z-30 hidden border-t border-mist bg-paper opacity-0 shadow-[0_24px_32px_-16px_rgb(0_0_0/0.15)] transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 lg:block">
                    <div className="submenu-content mx-auto flex max-w-7xl items-start justify-center gap-20 px-8 py-10">
                      {isMega ? (
                        item.children.map((child) => <MenuColumn key={child.url} item={child} shopAllLabel={nav.shopAll} />)
                      ) : (
                        <div className="submenu-column min-w-44">
                          <p className="submenu-title text-base font-semibold text-ink">{item.title}</p>
                          <ul className="submenu-links mt-4 space-y-3">
                            {item.children.map((child) => (
                              <li key={child.url} className="submenu-item">
                                <Link href={child.url} className="submenu-link text-sm text-gray-500 hover:text-ink hover:underline">
                                  {child.title}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {item.image && (
                        <Link href={item.url} className="submenu-promo ml-auto shrink-0">
                          <Image
                            src={item.image}
                            alt=""
                            width={160}
                            height={160}
                            className="submenu-promo-image h-40 w-40 rounded-xl border border-mist object-contain"
                          />
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/*
        Always-on vanilla island (not gated by VanillaIsland/hydratePaths):
        MegaMenu is a plain server component whose panels open via CSS hover /
        a checkbox on every route, so there is no React version to hand the
        close-on-navigate behavior off to. See public/js/mega-menu.js.
      */}
      <script type="module" src="/js/mega-menu.js" data-island="" />
    </nav>
  );
}
