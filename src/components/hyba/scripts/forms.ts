/**
 * Progressive-enhancement submit intercepts for the server-action forms that already work with
 * zero JS (addToCartAction, toggleWishlistAction, toggleCompareAction — see src/lib/actions.ts).
 * Alpine intercepts the submit, posts JSON to the matching /api/... route handler, and updates
 * local + header state without a page reload. Add-to-cart awaits the fresh section-data reload
 * before opening the drawer — dispatching 'toggle-cart' first (with the reload merely kicked off
 * via event) let the drawer render on the still-stale (often empty) cart snapshot for a beat.
 * On any failure the interceptor falls back to
 * `form.submit()` — a genuine native submit (bypasses the 'submit' event, so no re-entry into
 * this same handler) that degrades to the exact same request the form's own `action` already
 * handles. Both factories are guarded `??=` so re-emitting the source (many tiles per page) is
 * a no-op after the first.
 */
export const initAddToCartFormSource = `
window.initAddToCartForm ??= function () {
  return {
    async submitForm(event) {
      const form = event.target;
      const sku = form.sku.value;
      const quantity = Math.max(1, Number(form.quantity ? form.quantity.value : 1) || 1);
      try {
        await window.hyvaLike.postJson('/api/cart/add', { sku, quantity });
        await window.hyvaLike.reloadSections();
        window.hyvaLike.dispatch('toggle-cart', { isOpen: true });
      } catch (error) {
        console.error('[hyva] add-to-cart failed, falling back to full submit', error);
        form.submit();
      }
    },
  };
};
`;

/**
 * Generic toggle-button factory shared by the wishlist and compare "single button, no separate
 * add/remove forms" controls (WishlistButton.tsx / CompareButton.tsx). `config` carries
 * everything server-rendered so the factory itself stays product-agnostic:
 *   pressed, addLabel, removeLabel, endpoint, pressedKey (response field to read the new
 *   pressed state from), and — compare only — fullLabel/isFullInitially/countKey/maxItemsKey to
 *   grey the button out once the list fills up without a page reload.
 */
export const initToggleFormSource = `
window.initToggleForm ??= function (config) {
  return {
    pressed: config.pressed,
    isFull: config.isFullInitially || false,
    fullLabel: config.fullLabel || '',
    get label() {
      if (this.isFull) return config.fullLabel;
      return this.pressed ? config.removeLabel : config.addLabel;
    },
    async submitForm(event) {
      if (this.isFull) return;
      const form = event.target;
      const sku = form.sku.value;
      try {
        const result = await window.hyvaLike.postJson(config.endpoint, { sku });
        this.pressed = result[config.pressedKey];
        if (config.countKey && config.maxItemsKey) {
          this.isFull = !this.pressed && result[config.countKey].count >= result[config.maxItemsKey];
        }
        window.hyvaLike.dispatch('reload-customer-section-data');
      } catch (error) {
        console.error('[hyva] toggle failed, falling back to full submit', error);
        form.submit();
      }
    },
  };
};
`;
