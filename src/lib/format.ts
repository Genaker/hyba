// Re-exports the shared vanilla lib so server/React code and browser islands
// use the exact same implementation (single source of truth).
export { formatMoney, tierPrice } from '../../public/js/lib/money.js';
