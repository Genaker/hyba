/**
 * Slide-over cart drawer, built on the native \`<dialog>\` element (CartDrawer.tsx wires
 * \`x-effect\` to call showModal()/close() as \`isOpen\` changes) — Escape-to-close and focus
 * trapping come from the browser itself, so there's no manual keydown listener here.
 * \`initial\` is the server-rendered cart snapshot (same shape as CustomerSectionsPayload['cart'])
 * so a fresh page load already has correct contents; every mutation afterwards (add/update/
 * remove) replaces \`cart\` from the matching route handler's own response via
 * \`private-content-loaded\` — no page reload, the behavior this whole architecture exists to
 * deliver. \`busySku\` disables a line's own controls mid-request without blocking the rest of
 * the drawer.
 */
export const initCartDrawerSource = `
window.initCartDrawer ??= function (initial) {
  return {
    isOpen: false,
    cart: initial,
    busySku: null,
    init() {
      window.addEventListener('private-content-loaded', (event) => {
        this.cart = event.detail.data.cart;
      });
      window.addEventListener('toggle-cart', (event) => {
        this.isOpen = event.detail && typeof event.detail.isOpen === 'boolean' ? event.detail.isOpen : !this.isOpen;
      });
    },
    async updateQuantity(sku, quantity) {
      this.busySku = sku;
      try {
        await window.hyvaLike.postJson('/api/cart/update', { sku, quantity: Math.max(0, quantity) });
        window.hyvaLike.dispatch('reload-customer-section-data');
      } catch (error) {
        console.error('[hyva] cart update failed', error);
      } finally {
        this.busySku = null;
      }
    },
    async removeItem(sku) {
      this.busySku = sku;
      try {
        await window.hyvaLike.postJson('/api/cart/remove', { sku });
        window.hyvaLike.dispatch('reload-customer-section-data');
      } catch (error) {
        console.error('[hyva] cart remove failed', error);
      } finally {
        this.busySku = null;
      }
    },
  };
};
`;
