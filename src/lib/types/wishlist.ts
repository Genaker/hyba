import type { Product } from './product';

/**
 * What's actually persisted in the wishlist cookie — just the SKU, re-resolved to a live
 * `Product` on every request (same "cookie holds only the id" shape as `CartItem`, see cart.ts).
 * No UCP (ucp.dev) capability covers wishlists, so this is named freely.
 *
 * @example
 * { "sku": "0RT28" }
 */
export interface WishlistItem {
  sku: string;
}

/**
 * A `WishlistItem` joined with its live `Product` — what the wishlist page/header link render.
 *
 * @example
 * { "product": { "sku": "MS03-M-Gray", "title": "Balboa Persistence Tee", "...": "see Product" } }
 */
export interface WishlistLine {
  product: Product;
}
