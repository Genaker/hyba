/**
 * Header quick search — replaces the original storefront's React SearchAutocomplete on this
 * fork (photo/voice search dropped for v1, see the fork plan's Phase 2 notes; the plain
 * GET form submit to /product/search stays the zero-JS fallback path regardless). Debounced
 * fetch against the existing /api/sku-search endpoint; ↑/↓ move, Enter opens the active result,
 * Escape closes.
 */
export const initMiniSearchSource = `
window.initMiniSearch ??= function (labels) {
  return {
    query: '',
    suggestions: [],
    isOpen: false,
    activeIndex: -1,
    debounceTimer: null,
    labels,
    onInput() {
      this.activeIndex = -1;
      window.clearTimeout(this.debounceTimer);
      if (this.query.trim().length < 3) {
        this.suggestions = [];
        this.isOpen = false;
        return;
      }
      this.debounceTimer = window.setTimeout(() => this.runSearch(), 200);
    },
    async runSearch() {
      try {
        const response = await fetch('/api/sku-search?q=' + encodeURIComponent(this.query.trim()), { headers: { accept: 'application/json' } });
        this.suggestions = response.ok ? await response.json() : [];
        this.isOpen = this.suggestions.length > 0;
      } catch (error) {
        console.error('[hyva] search failed', error);
      }
    },
    moveActive(delta) {
      if (!this.isOpen || this.suggestions.length === 0) return;
      this.activeIndex = (this.activeIndex + delta + this.suggestions.length) % this.suggestions.length;
    },
    openActive() {
      if (this.activeIndex < 0 || !this.suggestions[this.activeIndex]) return;
      window.location.href = this.suggestions[this.activeIndex].url;
    },
    close() {
      this.isOpen = false;
      this.activeIndex = -1;
    },
  };
};
`;
