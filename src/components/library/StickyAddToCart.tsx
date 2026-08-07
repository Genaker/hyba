import { formatMoney } from '@/lib/format';

/** Fixed bottom add-to-cart bar for long product pages — a plain form posting
 *  to `action` (server action route), zero JS. */
export default function StickyAddToCart({ title, price, sku, action, quantityName = 'quantity' }: { title: string; price: number; sku?: string; action: string; quantityName?: string }) {
  return (
    <form action={action} method="post" className="sticky-add-to-cart fixed inset-x-0 bottom-0 z-40 border-t border-mist bg-paper shadow-[0_-8px_24px_-12px_rgb(0_0_0/0.2)]">
      <div className="sticky-add-to-cart-content mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <div className="sticky-add-to-cart-info min-w-0 flex-1">
          <p className="sticky-add-to-cart-title truncate text-sm font-semibold text-ink">{title}</p>
          <p className="sticky-add-to-cart-price text-sm text-gray-600">{formatMoney(price)}</p>
        </div>
        {sku && <input type="hidden" name="sku" value={sku} />}
        <input type="number" name={quantityName} defaultValue={1} min={1} className="sticky-add-to-cart-qty w-16 rounded-lg border border-gray-300 px-2 py-2 text-center text-sm" aria-label="Quantity" />
        <button type="submit" className="sticky-add-to-cart-submit rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
          Add to Cart
        </button>
      </div>
    </form>
  );
}
