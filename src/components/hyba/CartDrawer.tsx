import InlineScript from './InlineScript';
import { initCartDrawerSource } from './scripts/cart-drawer';
import { jsonForAttribute, alpineAttrs } from '@/lib/hyva/inline';
import type { CustomerSectionsPayload } from '@/lib/hyva/section-data';

/**
 * Slide-over cart drawer — the signature Hyba moment: add-to-cart opens it with the fresh line
 * already in place, no page reload. `initialCart` is the server-rendered snapshot so first paint
 * (before Alpine mounts) is correct; see scripts/cart-drawer.ts for the live-update behavior.
 *
 * Built on the native `<dialog>` element (studied from the real Hyvä demo's own cart drawer,
 * which uses the same approach) rather than a manual div + backdrop: `showModal()` gets us a
 * native focus trap, Escape-to-close, and top-layer stacking for free — this codebase's other
 * CSS-only Modal explicitly documents NOT having focus trapping as a known limitation, which
 * `<dialog>` sidesteps entirely. Backdrop click-to-close is still wired by hand (`closedby="any"`,
 * the newest way to get that natively, isn't broadly supported yet).
 */
export default function CartDrawer({ initialCart, labels }: {
  initialCart: CustomerSectionsPayload['cart'];
  labels: { cartLabel: string; empty: string; subtotal: string; viewCart: string; checkout: string; remove: string; quantity: string };
}) {
  return (
    <div x-data={`initCartDrawer(${jsonForAttribute(initialCart)})`} className="cart-drawer-root">
      <button
        type="button"
        {...alpineAttrs({ 'x-on:click': "window.hyvaLike.dispatch('toggle-cart')" })}
        aria-label={labels.cartLabel}
        className="cart-drawer-trigger relative flex items-center gap-1 font-medium hover:text-brand-600"
      >
        <span aria-hidden className="cart-drawer-trigger-icon text-lg">🛍</span>
        <span
          x-show="cart.count > 0"
          x-cloak=""
          x-text="cart.count"
          className="cart-drawer-trigger-count absolute -right-3 -top-2 rounded-full bg-accent px-1.5 text-xs font-bold text-white"
        >
          {initialCart.count > 0 ? initialCart.count : ''}
        </span>
      </button>

      {/* Open/close animation (including the ::backdrop) is CSS-only, keyed off the [open]
          attribute — see catalog.css/customer.css. Alpine's own x-transition hooks into
          x-show's display toggling, which doesn't apply here (showModal()/close() drive
          this element's visibility, not Alpine), so mixing the two would risk the inline
          style x-show writes fighting the dialog's own open-state rendering. */}
      <dialog
        {...alpineAttrs({
          'x-ref': 'dialog',
          'x-effect': 'isOpen ? $refs.dialog.showModal() : $refs.dialog.close()',
          'x-on:close': 'isOpen = false',
          'x-on:click': 'if ($event.target === $refs.dialog) isOpen = false',
        })}
        aria-label={labels.cartLabel}
        className="cart-drawer-panel m-0 ml-auto h-full max-h-full w-full max-w-sm flex-col bg-paper p-0 shadow-2xl open:flex"
      >
        <div className="cart-drawer-header flex items-center justify-between border-b border-mist px-4 py-3">
          <h2 className="cart-drawer-title text-base font-semibold">{labels.cartLabel}</h2>
          <button
            type="button"
            {...alpineAttrs({ 'x-on:click': 'isOpen = false' })}
            aria-label="Close"
            className="cart-drawer-close rounded p-1.5 text-gray-500 hover:bg-mist"
          >
            ✕
          </button>
        </div>

        <div className="cart-drawer-body flex-1 overflow-y-auto px-4 py-3">
          <div x-show="cart.items.length === 0" className="cart-drawer-empty flex flex-col items-center gap-3 py-12 text-center text-sm text-gray-600">
            <svg aria-hidden viewBox="0 0 24 24" className="cart-drawer-empty-icon h-16 w-16 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 11-1 9M19 11l-4-7M2 11h20M3.5 11l1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.7-7.4M4.5 15.5h15M5 11l4-7M9 11l1 9" />
            </svg>
            <p>{labels.empty}</p>
          </div>

          <ul x-show="cart.items.length > 0" className="cart-drawer-items divide-y divide-mist">
            <template x-for="item in cart.items" {...alpineAttrs({ 'x-bind:key': 'item.sku' })}>
              <li className="cart-drawer-item flex items-center gap-3 py-3">
                <img
                  {...alpineAttrs({ 'x-bind:src': "item.image || ''" })}
                  x-show="item.image"
                  alt=""
                  className="cart-drawer-item-image h-14 w-14 shrink-0 rounded-lg border border-mist object-contain"
                />
                <div className="cart-drawer-item-info min-w-0 flex-1">
                  <a
                    {...alpineAttrs({ 'x-bind:href': 'item.url' })}
                    x-text="item.title"
                    className="cart-drawer-item-name block truncate text-sm font-medium hover:text-brand-600"
                  />
                  <p
                    x-show="item.options.length > 0"
                    x-text="item.options.map((option) => option.label + ': ' + option.value).join(', ')"
                    className="cart-drawer-item-options truncate text-xs text-gray-500"
                  />
                  <p className="cart-drawer-item-price mt-1 text-xs text-gray-500">
                    <input
                      type="number"
                      min="0"
                      {...alpineAttrs({
                        'x-bind:value': 'item.quantity',
                        'x-bind:disabled': 'busySku === item.sku',
                        'x-on:change': 'updateQuantity(item.sku, Number($event.target.value))',
                      })}
                      className="cart-drawer-item-qty w-14 rounded border border-gray-300 px-1.5 py-0.5 text-xs"
                    />
                    <span x-text="'× ' + item.unitPriceFormatted" />
                  </p>
                </div>
                <div className="cart-drawer-item-end flex shrink-0 flex-col items-end gap-1">
                  <span x-text="item.totalPriceFormatted" className="cart-drawer-item-total text-sm font-semibold" />
                  <button
                    type="button"
                    {...alpineAttrs({ 'x-on:click': 'removeItem(item.sku)', 'x-bind:disabled': 'busySku === item.sku' })}
                    className="cart-drawer-item-remove text-xs text-gray-400 hover:text-red-600"
                  >
                    {labels.remove}
                  </button>
                </div>
              </li>
            </template>
          </ul>
        </div>

        <div x-show="cart.items.length > 0" className="cart-drawer-footer border-t border-mist px-4 py-3">
          <p className="cart-drawer-subtotal mb-3 flex justify-between text-sm font-semibold">
            <span>{labels.subtotal}</span>
            <span x-text="cart.subtotalFormatted" />
          </p>
          <div className="cart-drawer-actions grid grid-cols-2 gap-2 text-center text-sm font-semibold">
            <a href="/cart" className="cart-drawer-view-cart rounded-lg border border-brand-600 py-2 text-brand-600 hover:bg-brand-50">
              {labels.viewCart}
            </a>
            <a href="/checkout" className="cart-drawer-checkout rounded-lg bg-brand-600 py-2 text-white hover:bg-brand-700">
              {labels.checkout}
            </a>
          </div>
        </div>
      </dialog>

      <InlineScript code={initCartDrawerSource} />
    </div>
  );
}
