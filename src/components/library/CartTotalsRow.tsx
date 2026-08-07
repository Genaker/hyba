import { formatMoney } from '@/lib/format';

/** One label/amount line in a totals block; `emphasis` for the grand total. */
export default function CartTotalsRow({ label, amount, emphasis = false }: { label: string; amount: number; emphasis?: boolean }) {
  return (
    <div className={`cart-totals-row flex justify-between ${emphasis ? 'cart-totals-row-total border-t border-mist pt-2 text-base font-bold' : 'text-sm text-gray-600'}`}>
      <span className="cart-totals-label">{label}</span>
      <span className="cart-totals-amount">{formatMoney(amount)}</span>
    </div>
  );
}
