import { isInWishlist } from '@/lib/wishlist';
import { toggleWishlistAction } from '@/lib/actions';
import { jsonForAttribute, alpineAttrs } from '@/lib/hyva/inline';

/** Product-page control: a single button that toggles wishlist membership — no separate
 * add/remove forms, mirrors AddToShoppingList's form+server-action shape. The `action` form
 * POST stays the no-JS fallback; Alpine's initToggleForm (src/components/hyba/scripts/forms.ts,
 * emitted once globally — see GlobalScripts.tsx) intercepts it so the button flips state and the
 * header count updates without a page reload. */
export default async function WishlistButton({
  sku,
  back,
  addLabel,
  removeLabel,
}: {
  sku: string;
  back: string;
  addLabel: string;
  removeLabel: string;
}) {
  const inWishlist = await isInWishlist(sku);
  const config = { pressed: inWishlist, addLabel, removeLabel, fullLabel: '', endpoint: '/api/wishlist/toggle', pressedKey: 'inWishlist' };
  return (
    <form
      action={toggleWishlistAction}
      {...alpineAttrs({ 'x-data': `initToggleForm(${jsonForAttribute(config)})`, 'x-on:submit.prevent': 'submitForm($event)' })}
      className="wishlist-button mt-3 inline-block"
    >
      <input className="wishlist-button-param" type="hidden" name="sku" value={sku} />
      <input className="wishlist-button-param" type="hidden" name="back" value={back} />
      <button
        type="submit"
        {...alpineAttrs({
          'x-bind:aria-pressed': 'pressed',
          'x-bind:class': "pressed ? 'border-red-600 text-red-600 hover:bg-red-50' : 'border-gray-300 text-ink hover:border-gray-400'",
        })}
        aria-pressed={inWishlist}
        className="wishlist-button-submit inline-flex items-center gap-1.5 rounded-lg border px-4 py-1.5 text-sm font-medium"
      >
        <span aria-hidden x-text="pressed ? '♥' : '♡'" className="wishlist-button-icon text-base">{inWishlist ? '♥' : '♡'}</span>
        <span x-text="label">{inWishlist ? removeLabel : addLabel}</span>
      </button>
    </form>
  );
}
