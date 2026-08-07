import { isInCompare, readCompare, MAX_COMPARE_ITEMS } from '@/lib/compare';
import { toggleCompareAction } from '@/lib/actions';
import { jsonForAttribute, alpineAttrs } from '@/lib/hyva/inline';

/** Product-page control: a single button that toggles compare-list membership — disabled (not
 * hidden, so the reason is visible via `title`) once the list is full and this product isn't
 * already in it, same MAX_COMPARE_ITEMS cap compare.ts enforces again server-side. See
 * WishlistButton.tsx for the shared initToggleForm intercept this uses. */
export default async function CompareButton({
  sku,
  back,
  addLabel,
  removeLabel,
  fullLabel,
}: {
  sku: string;
  back: string;
  addLabel: string;
  removeLabel: string;
  fullLabel: string;
}) {
  const [inCompare, items] = await Promise.all([isInCompare(sku), readCompare()]);
  const isFull = !inCompare && items.length >= MAX_COMPARE_ITEMS;
  const config = {
    pressed: inCompare,
    addLabel,
    removeLabel,
    fullLabel,
    isFullInitially: isFull,
    endpoint: '/api/compare/toggle',
    pressedKey: 'inCompare',
    countKey: 'compare',
    maxItemsKey: 'maxItems',
  };
  return (
    <form
      action={toggleCompareAction}
      {...alpineAttrs({ 'x-data': `initToggleForm(${jsonForAttribute(config)})`, 'x-on:submit.prevent': 'submitForm($event)' })}
      className="compare-button mt-3 inline-block"
    >
      <input className="compare-button-param" type="hidden" name="sku" value={sku} />
      <input className="compare-button-param" type="hidden" name="back" value={back} />
      <button
        type="submit"
        {...alpineAttrs({
          'x-bind:disabled': 'isFull',
          'x-bind:aria-pressed': 'pressed',
          'x-bind:title': 'isFull ? fullLabel : null',
          'x-bind:class': "pressed ? 'border-brand-600 text-brand-600 hover:bg-brand-50' : 'border-gray-300 text-ink hover:border-gray-400'",
        })}
        disabled={isFull}
        aria-pressed={inCompare}
        title={isFull ? fullLabel : undefined}
        className="compare-button-submit inline-flex items-center gap-1.5 rounded-lg border px-4 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-transparent"
      >
        <span x-text="label">{inCompare ? removeLabel : addLabel}</span>
      </button>
    </form>
  );
}
