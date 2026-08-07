import { formatMoney } from '@/lib/format';

/** Per-unit price line, e.g. "$0.42 / oz". */
export default function UnitPrice({ amount, unit }: { amount: number; unit: string }) {
  return (
    <span className="unit-price text-xs text-gray-500">
      {formatMoney(amount)} / {unit}
    </span>
  );
}
