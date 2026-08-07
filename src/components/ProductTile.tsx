import Link from 'next/link';
import AppImage from './AppImage';
import type { Product } from '@/lib/types';
import type { Dictionary } from '@/lib/i18n';
import { formatMoney } from '@/lib/format';
import AddToCartButton from './AddToCartButton';
import { productUrl } from '@/lib/urls';

/**
 * Suspense-fallback placeholder for one tile. Mirrors the real markup below —
 * same wrapper classes, same child elements and margins, pulsing bars instead
 * of text — so the reserved box inherits any CSS changes to those shared
 * classes and the swap-in causes no layout shift (empirically tuned: the
 * two h-5 title bars reserve slightly MORE than a real 2-line wrapped title,
 * the safe direction — shorter real content leaves slack, never grows).
 * Editing ProductTile's structure? Update this skeleton to match.
 */
export function ProductTileSkeleton() {
  return (
    <article className="product-item flex flex-col rounded-xl border border-mist bg-paper p-4">
      <div className="product-item-photo block">
        <div aria-hidden className="product-item-image-placeholder mx-auto aspect-square w-full max-w-60 rounded-lg bg-mist" />
      </div>
      <p className="product-item-sku mt-3 text-xs text-gray-500"><span className="inline-block h-3 w-14 animate-pulse rounded bg-mist" /></p>
      <h3 className="product-item-name mt-1 flex-1 space-y-1.5 text-sm font-medium leading-snug">
        <span className="block h-5 w-4/5 animate-pulse rounded bg-mist" />
        <span className="block h-5 w-1/2 animate-pulse rounded bg-mist" />
      </h3>
      <div className="product-item-price-box mt-2 flex items-center justify-between gap-2">
        <span className="inline-block h-6 w-16 animate-pulse rounded bg-mist" />
      </div>
      <div aria-hidden className="box-tocart mt-2 h-9 w-full animate-pulse rounded-lg bg-mist" />
    </article>
  );
}

export default function ProductTile({
  product,
  dictionary,
  priority = false,
}: {
  product: Product;
  dictionary: Dictionary;
  priority?: boolean;
}) {
  const { product: t } = dictionary;
  const url = productUrl(product);
  const price = product.prices[0]?.amount;
  // Second gallery shot ≠ the primary image → Hyvä-style hover swap, pure CSS (opacity
  // crossfade via group-hover), no JS: fades in over the primary shot on :hover/:focus.
  const hoverImage = product.gallery.find((image) => image !== product.image) ?? null;

  return (
    <article className="product-item group flex flex-col rounded-xl border border-mist bg-paper p-4 transition-shadow hover:shadow-lg">
      <Link href={url} className="product-item-photo relative block" aria-label={product.title} tabIndex={-1}>
        {product.image ? (
          <AppImage
            src={product.image}
            alt={product.title}
            width={378}
            height={378}
            displayWidth={240}
            priority={priority}
            quality={70}
            // Fixed per-breakpoint sizes, not viewport math: the tile is `w-full
            // max-w-60` so it never exceeds 240px (≈160px in the 2-col mobile grid).
            // vw-based sizes overstated this badly — a 20vw hint on a 1440px window
            // claims 288px — and pushed browsers onto much larger candidates than
            // they render.
            sizes="(max-width: 767px) 160px, 240px"
            className="product-item-image mx-auto aspect-square w-full max-w-60 rounded-lg object-contain"
          />
        ) : (
          <div aria-hidden className="product-item-image-placeholder mx-auto aspect-square w-full max-w-60 rounded-lg bg-mist" />
        )}
        {hoverImage && (
          <AppImage
            src={hoverImage}
            alt=""
            width={378}
            height={378}
            displayWidth={240}
            quality={70}
            sizes="(max-width: 767px) 160px, 240px"
            className="product-item-image-hover absolute inset-0 mx-auto aspect-square w-full max-w-60 rounded-lg object-contain opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          />
        )}
      </Link>
      <p className="product-item-sku mt-3 text-xs text-gray-500">{product.sku}</p>
      <h3 className="product-item-name mt-1 flex-1 text-sm font-medium leading-snug">
        <Link href={url} className="product-item-link hover:text-brand-600">{product.title}</Link>
      </h3>
      <div className="product-item-price-box mt-2 flex items-center justify-between gap-2">
        <p className="price text-lg font-semibold">{price !== undefined ? formatMoney(price) : '—'}</p>
        {!product.inStock && <span className="product-item-stock text-xs font-medium text-red-600">{t.outOfStock}</span>}
      </div>
      {product.inStock && (
        <AddToCartButton sku={product.sku} back={url} compact quantityLabel={t.quantity} addToCartLabel={t.addToCart} />
      )}
    </article>
  );
}
