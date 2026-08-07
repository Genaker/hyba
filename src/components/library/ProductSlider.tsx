import { formatMoney } from '@/lib/format';

export type ProductSlide = { title: string; href: string; image: string | null; price: number };

/** Horizontal scroll-snap strip of compact product cards, zero JS. */
export default function ProductSlider({ products }: { products: ProductSlide[] }) {
  if (products.length === 0) return null;
  return (
    <div className="product-slider flex snap-x gap-4 overflow-x-auto pb-2">
      {products.map((product) => (
        <a key={product.href} href={product.href} className="product-slider-item w-44 shrink-0 snap-start rounded-xl border border-mist p-3 hover:border-brand-500">
          {product.image ? (
            <img src={product.image} alt={product.title} className="product-slider-image aspect-square w-full rounded-lg object-cover" />
          ) : (
            <span aria-hidden className="product-slider-placeholder block aspect-square w-full rounded-lg bg-mist" />
          )}
          <span className="product-slider-title mt-2 block truncate text-sm font-medium text-ink">{product.title}</span>
          <span className="product-slider-price block text-sm font-semibold text-ink">{formatMoney(product.price)}</span>
        </a>
      ))}
    </div>
  );
}
