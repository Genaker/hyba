/**
 * One volume-pricing tier. `quantity` is the minimum order quantity this
 * price applies from; a product's cheapest per-unit price is the tier with
 * the highest `quantity` that the order still meets or exceeds.
 *
 * @see https://ucp.dev/2026-04-08/specification/catalog/ — UCP Price object ({amount, currency}); we add `quantity` for volume tiers
 *
 * @example
 * { "quantity": 10, "amount": 94.99, "currency": "USD" }
 */
export interface PriceTier {
  quantity: number;
  amount: number;
  currency: string;
}
