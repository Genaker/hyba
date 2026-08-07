import { formatMoney } from '@/lib/format';

/** Current price with an optional struck-through compare-at price. */
export default function PriceTag({ amount, compareAt }: { amount: number; compareAt?: number }) {
  const hasDiscount = compareAt !== undefined && compareAt > amount;
  return (
    <span className="price-tag inline-flex items-baseline gap-2">
      <span className={`price-tag-current font-semibold ${hasDiscount ? 'text-red-700' : 'text-ink'}`}>{formatMoney(amount)}</span>
      {hasDiscount && <s className="price-tag-compare text-sm text-gray-500">{formatMoney(compareAt)}</s>}
    </span>
  );
}
