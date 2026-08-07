import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/lib/types';
import type { Dictionary } from '@/lib/i18n';
import { formatMoney } from '@/lib/format';
import AddToCartButton from './AddToCartButton';
import { productUrl } from '@/lib/urls';

/** List / compact row for the listing view modes (grid uses ProductTile). */
export default function ProductRow({
  product,
  dictionary,
  compact = false,
}: {
  product: Product;
  dictionary: Dictionary;
  compact?: boolean;
}) {
  const { product: t } = dictionary;
  const url = productUrl(product);
  const price = product.prices[0]?.amount;

  if (compact) {
    return (
      <div className="product-row flex items-center gap-4 py-2">
        <span className="product-item-sku w-20 shrink-0 text-xs text-gray-500">{product.sku}</span>
        <h3 className="product-item-name min-w-0 flex-1 truncate text-sm font-medium">
          <Link href={url} className="product-item-link hover:text-brand-600">{product.title}</Link>
        </h3>
        <span className="price w-20 text-right text-sm font-semibold">
          {price !== undefined ? formatMoney(price) : '—'}
        </span>
        {product.inStock ? (
          <AddToCartButton sku={product.sku} back={url} compact quantityLabel={t.quantity} addToCartLabel={t.addToCart} />
        ) : (
          <span className="product-item-stock w-24 text-right text-xs font-medium text-red-600">{t.outOfStock}</span>
        )}
      </div>
    );
  }

  return (
    <article className="product-row flex gap-5 rounded-xl border border-mist bg-paper p-4 transition-shadow hover:shadow-lg">
      <Link href={url} className="product-item-photo shrink-0" aria-label={product.title} tabIndex={-1}>
        {product.image ? (
          <Image
            src={product.image}
            alt={product.title}
            width={120}
            height={120}
            className="product-item-image h-28 w-28 rounded-lg border border-mist object-contain"
          />
        ) : (
          <div aria-hidden className="product-item-image-placeholder h-28 w-28 rounded-lg bg-mist" />
        )}
      </Link>
      <div className="product-item-details min-w-0 flex-1">
        <p className="product-item-sku text-xs text-gray-500">{product.sku}{product.brand ? ` · ${product.brand}` : ''}</p>
        <h3 className="product-item-name mt-0.5 text-base font-medium">
          <Link href={url} className="product-item-link hover:text-brand-600">{product.title}</Link>
        </h3>
        {product.shortDescription && (
          <p className="product-item-description mt-1 line-clamp-2 text-sm text-gray-600">{product.shortDescription}</p>
        )}
      </div>
      <div className="product-item-actions flex w-36 shrink-0 flex-col items-end justify-center gap-1">
        <p className="price text-lg font-semibold">{price !== undefined ? formatMoney(price) : '—'}</p>
        {product.inStock ? (
          <AddToCartButton sku={product.sku} back={url} compact quantityLabel={t.quantity} addToCartLabel={t.addToCart} />
        ) : (
          <span className="product-item-stock text-xs font-medium text-red-600">{t.outOfStock}</span>
        )}
      </div>
    </article>
  );
}
