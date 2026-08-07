// Shared money helpers — single source of truth for BOTH worlds:
// - islands import it in the browser:  import { formatMoney } from '/js/lib/money.js'
// - React/server code imports it too:  src/lib/format.ts re-exports this file
// Keep it dependency-free and pure.
const usdFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

/**
 * @param {number} amount
 * @returns {string} e.g. "$19.99"
 */
export function formatMoney(amount) {
  return usdFormatter.format(amount);
}

/**
 * Tier price for a quantity: highest tier whose min quantity is met.
 * @param {{quantity: number, amount: number}[]} tiers sorted by quantity asc
 * @param {number} quantity
 * @returns {number}
 */
export function tierPrice(tiers, quantity) {
  let amount = tiers[0]?.amount ?? 0;
  for (const tier of tiers) if (quantity >= tier.quantity) amount = tier.amount;
  return amount;
}
