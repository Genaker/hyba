import type { Product } from './product';

/**
 * What's actually persisted in the cart cookie — just enough to look the
 * product back up and re-resolve its current tier price on every request.
 *
 * @example
 * { "sku": "0RT28", "quantity": 10 }
 */
export interface CartItem {
  sku: string;
  quantity: number;
}

/**
 * A `CartItem` joined with its live `Product` and the tier price resolved
 * for the current quantity — what the cart/mini-cart/checkout pages render.
 *
 * @see https://ucp.dev/2026-04-08/specification/cart/ — UCP Cart capability (unitPrice/totalPrice naming follows its line items)
 *
 * @example
 * {
 *   "product": { "sku": "MS03-M-Gray", "title": "Balboa Persistence Tee", "...": "see Product" },
 *   "quantity": 10,
 *   "unitPrice": 94.99,
 *   "totalPrice": 949.90,
 *   "selectedOptions": [{ "label": "Size", "value": "M" }, { "label": "Color", "value": "Gray" }]
 * }
 */
export interface CartLine {
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  selectedOptions: { label: string; value: string }[]; // [] for a simple (non-configurable) product
}
