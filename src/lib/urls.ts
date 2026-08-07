import type { Category, Product } from './types';

/**
 * Canonical storefront URL builders — the single place URL shapes are
 * defined. src/lib/url-resolver.ts is the read side of this contract:
 * a product resolves ONLY at productUrl()'s exact shape (strict canonical,
 * no fallbacks), so changing a shape here means changing the resolver too.
 * Pure functions, safe to import from both server and client components.
 */

/** `/women/tops-women/jackets-women/adrienne-trek-jacket` */
export function productUrl(product: Pick<Product, 'categoryPath' | 'slug'>): string {
  return product.categoryPath ? `/${product.categoryPath}/${product.slug}` : `/${product.slug}`;
}

/**
 * A variant option's label as a URL-safe query param key — e.g. "Pack Size" -> "pack-size".
 * The single source of truth for that mapping: ConfigurableProductPanel writes ?key=value as
 * options are picked, productUrlWithOptions (below) reads them back for a cart line's "back to
 * product" link. Deriving both from the same label text (not a provider's own `code`, which
 * isn't guaranteed to equal slugify(label) — Salesforce's `packsize` vs "Pack Size" is one
 * example) keeps the two directions consistent regardless of dataset.
 */
export function slugifyOptionLabel(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/**
 * productUrl() with the given selected variant options appended as query params (e.g.
 * ?color=red&size=m) — so a cart line's "back to product" link, or a copy-pasted/bookmarked
 * PDP URL, restores the exact variant that was selected instead of just the bare product page.
 * `options` is deliberately the same {label, value}[] shape both ConfigurableProductPanel's
 * axes and DataProvider.getVariantOptions()/CartLine.selectedOptions already use.
 */
export function productUrlWithOptions(
  product: Pick<Product, 'categoryPath' | 'slug'>,
  options: { label: string; value: string }[],
): string {
  const base = productUrl(product);
  if (options.length === 0) return base;
  const params = new URLSearchParams();
  for (const option of options) params.set(slugifyOptionLabel(option.label), option.value);
  return `${base}?${params.toString()}`;
}

/** `/women/tops-women/jackets-women` */
export function categoryUrl(category: Pick<Category, 'path'>): string {
  return `/${category.path}`;
}

/** `/about` */
export function cmsUrl(slug: string): string {
  return `/${slug}`;
}

/**
 * Guards a post-action redirect target (e.g. a `?back=` param) against open
 * redirect — only a same-site relative path is allowed, so `/login?back=https://evil.example`
 * or `back=//evil.example` falls back instead of bouncing a just-authenticated user off-site.
 * Rejects anything not starting with a single `/` (absolute URLs, `//host` protocol-relative,
 * and `/\host`, which browsers normalize to `//host`).
 */
export function safeBack(value: FormDataEntryValue | string | null, fallback: string): string {
  const candidate = typeof value === 'string' ? value : '';
  return /^\/(?!\/|\\)/.test(candidate) ? candidate : fallback;
}
