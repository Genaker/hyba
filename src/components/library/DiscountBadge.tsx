/** "-25%" chip; renders nothing when there is no actual discount. */
export default function DiscountBadge({ amount, compareAt }: { amount: number; compareAt: number }) {
  if (compareAt <= amount) return null;
  const percent = Math.round(((compareAt - amount) / compareAt) * 100);
  return <span className="discount-badge rounded bg-red-700 px-1.5 py-0.5 text-xs font-semibold text-white">-{percent}%</span>;
}
