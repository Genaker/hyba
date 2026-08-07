/** In stock / low stock / out of stock line. `quantity` is optional — when
 *  given and at/below `lowThreshold`, shows the scarcity variant. */
export default function StockStatus({ inStock, quantity, lowThreshold = 5 }: { inStock: boolean; quantity?: number; lowThreshold?: number }) {
  if (!inStock) return <p className="stock-status stock-status-out text-sm font-medium text-red-700">Out of stock</p>;
  if (quantity !== undefined && quantity <= lowThreshold) {
    return <p className="stock-status stock-status-low text-sm font-medium text-amber-700">Only {quantity} left</p>;
  }
  return <p className="stock-status stock-status-in text-sm font-medium text-green-700">In stock</p>;
}
