import { formatMoney } from '@/lib/format';
import type { PriceTier } from '@/lib/types';

/** "Buy 10+ for $8.99 each" — the cheapest volume tier, or nothing for single-tier pricing. */
export default function TierPriceHint({ tiers }: { tiers: PriceTier[] }) {
  const best = tiers.reduce((cheapest, tier) => (tier.amount < cheapest.amount ? tier : cheapest), tiers[0]);
  if (!best || best.quantity <= 1) return null;
  return (
    <p className="tier-price-hint text-sm text-brand-600">
      Buy {best.quantity}+ for {formatMoney(best.amount)} each
    </p>
  );
}
