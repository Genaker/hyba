import { addToCartAction } from '@/lib/actions';
import { alpineAttrs } from '@/lib/hyva/inline';
import type { PriceTier } from '@/lib/types';

/**
 * Server-action add-to-cart form — works with zero client JavaScript.
 * When `tiers` is given, the price-calc vanilla island shows a live line total.
 */
export default function AddToCartButton({
  sku,
  back,
  compact = false,
  tiers,
  disabled = false,
  quantityLabel,
  addToCartLabel,
}: {
  sku: string;
  back: string;
  compact?: boolean;
  tiers?: PriceTier[];
  disabled?: boolean;
  quantityLabel: string;
  addToCartLabel: string;
}) {
  return (
    <form
      action={addToCartAction}
      {...alpineAttrs({ 'x-data': 'initAddToCartForm()', 'x-on:submit.prevent': 'submitForm($event)' })}
      className={compact ? 'box-tocart mt-2' : 'box-tocart mt-4 flex flex-wrap items-end gap-3'}
      data-tiers={tiers ? JSON.stringify(tiers.map(({ quantity, amount }) => ({ quantity, amount }))) : undefined}
    >
      <input className="box-tocart-param" type="hidden" name="sku" value={sku} />
      <input className="box-tocart-param" type="hidden" name="back" value={back} />
      {!compact && (
        <label className="qty block text-sm">
          <span className="qty-label mb-1 block font-medium">{quantityLabel}</span>
          <input
            type="number"
            name="quantity"
            defaultValue={1}
            min={1}
            max={9999}
            className="qty-input w-24 rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
          />
        </label>
      )}
      <button
        type="submit"
        disabled={disabled}
        className={
          compact
            ? 'tocart w-full rounded-lg bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:hover:bg-gray-300'
            : 'tocart rounded-lg bg-brand-600 px-8 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:hover:bg-gray-300'
        }
      >
        {addToCartLabel}
      </button>
      {tiers && <output data-line-total className="box-tocart-total w-full text-sm font-medium text-gray-700" aria-live="polite" />}
    </form>
  );
}
