import InlineScript from './InlineScript';
import { initAddToCartFormSource, initToggleFormSource } from './scripts/forms';

/**
 * Factories that repeat many times per page — AddToCartButton and the wishlist/compare toggle
 * buttons can each render dozens of times on one category page — emitted ONCE from the root
 * layout instead of per instance. `window.initX ??=` guards make re-declaration safe but not
 * free: duplicating ~1KB of factory source per tile would bloat every listing page for nothing.
 * Single-instance chrome (Header's initHeader, CartDrawer's initCartDrawer, the search box's
 * initMiniSearch) carries its own <InlineScript> locally instead — no duplication risk there.
 */
export default function GlobalScripts() {
  return <InlineScript code={[initAddToCartFormSource, initToggleFormSource].join('\n')} />;
}
