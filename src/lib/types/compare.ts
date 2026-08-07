import type { Product } from './product';

/**
 * What's actually persisted in the compare cookie — just the SKU, re-resolved to a live
 * `Product` on every request (same "cookie holds only the id" shape as `CartItem`, see cart.ts).
 * No UCP (ucp.dev) capability covers product comparison, so this is named freely.
 *
 * @example
 * { "sku": "0RT28" }
 */
export interface CompareItem {
  sku: string;
}

/**
 * A `CompareItem` joined with its live `Product` — what the compare page/header link render.
 *
 * @example
 * { "product": { "sku": "MS03-M-Gray", "title": "Balboa Persistence Tee", "...": "see Product" } }
 */
export interface CompareLine {
  product: Product;
}
