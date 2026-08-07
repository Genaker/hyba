/**
 * Header chrome: live wishlist/compare badge counts (cart has its own counter inside
 * CartDrawer's initCartDrawer) kept in sync via `private-content-loaded` — see
 * public/js/hyva/bootstrap.mjs — plus the search-box open/close toggle. The mobile catalog menu
 * has its own self-contained checkbox-hack toggle (MegaMenu.tsx, kept zero-JS on purpose, see
 * that file), so it isn't duplicated here. `initial` is the server-rendered snapshot
 * (buildCustomerSections(), same call Header.tsx already makes) so the very first paint is
 * correct before the bootstrap module's own fetch resolves — this fork never hydrates, so every
 * page load needs a correct first paint, not just a post-mount one.
 */
export const initHeaderSource = `
window.initHeader ??= function (initial) {
  return {
    wishlistCount: initial.wishlistCount,
    compareCount: initial.compareCount,
    searchOpen: false,
    init() {
      window.addEventListener('private-content-loaded', (event) => {
        this.wishlistCount = event.detail.data.wishlist.count;
        this.compareCount = event.detail.data.compare.count;
      });
    },
    toggleSearch() {
      this.searchOpen = !this.searchOpen;
    },
  };
};
`;
