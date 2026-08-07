import type { Metadata } from 'next';
import { quickOrderAction } from '@/lib/actions';
import SubmitButton from '@/components/SubmitButton';

export const metadata: Metadata = { title: 'Quick Order Form' };

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none';

export default async function QuickOrderPage({ searchParams }: PageProps) {
  const rawParams = await searchParams;
  const addedCount = typeof rawParams.added === 'string' ? Number(rawParams.added) : 0;
  const invalidSkus = typeof rawParams.invalid === 'string' ? rawParams.invalid.split(',') : [];

  return (
    <div className="quick-order-page mx-auto max-w-2xl px-4 py-10">
      <h1 className="quick-order-title text-3xl font-bold">Quick Order Form</h1>
      <p className="quick-order-intro mt-2 text-sm text-gray-600">
        Enter SKUs and quantities, or paste a list — then add everything to your cart at once.
      </p>

      {addedCount > 0 && (
        <p role="status" className="quick-order-status mt-4 rounded-lg bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">
          {addedCount} {addedCount === 1 ? 'item' : 'items'} added to your cart.
        </p>
      )}
      {invalidSkus.length > 0 && (
        <p role="alert" className="quick-order-error mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          Unknown or unavailable SKUs: {invalidSkus.join(', ')}
        </p>
      )}

      <form action={quickOrderAction} className="quick-order-form mt-6 space-y-6">
        <fieldset className="quick-order-rows">
          <legend className="quick-order-rows-legend mb-2 text-sm font-semibold">Item rows</legend>
          <div className="quick-order-rows-list space-y-2">
            {Array.from({ length: 8 }, (_, index) => index + 1).map((row) => (
              <div key={row} className="quick-order-row flex gap-3">
                <label className="quick-order-sku-field flex-1">
                  <span className="quick-order-sku-label sr-only">SKU, row {row}</span>
                  <input name={`sku_${row}`} placeholder="SKU (e.g. 3RE23)" className={`quick-order-sku-input ${inputClass}`} />
                </label>
                <label className="quick-order-qty-field w-28">
                  <span className="quick-order-qty-label sr-only">Quantity, row {row}</span>
                  <input name={`qty_${row}`} type="number" min={1} placeholder="Qty" className={`quick-order-qty-input ${inputClass}`} />
                </label>
              </div>
            ))}
          </div>
        </fieldset>

        <label className="quick-order-paste block">
          <span className="quick-order-paste-label mb-1 block text-sm font-semibold">Or paste your order</span>
          <span className="quick-order-paste-hint mb-2 block text-xs text-gray-500">One item per line: SKU and quantity (e.g. “3RE23 10”)</span>
          <textarea name="paste" rows={4} placeholder={'3RE23 10\n2JV62 5'} className={`quick-order-paste-input ${inputClass}`} />
        </label>

        <SubmitButton
          className="quick-order-submit rounded-lg bg-brand-600 px-8 py-2.5 font-semibold text-white hover:bg-brand-700"
          pendingText="Adding to cart…"
        >
          Add to Cart
        </SubmitButton>
      </form>

      {/* Always-on island (same pattern as MiniCart's): SKU typeahead must work
          in every JS mode, so it loads unconditionally, not via VanillaIsland. */}
      <script type="module" src="/js/quick-order-search.js" data-island="" />
    </div>
  );
}
