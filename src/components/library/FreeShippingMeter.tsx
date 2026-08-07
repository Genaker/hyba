import { formatMoney } from '@/lib/format';

/** Progress toward a free-shipping threshold, with the "you qualify" state. */
export default function FreeShippingMeter({ subtotal, threshold }: { subtotal: number; threshold: number }) {
  const qualifies = subtotal >= threshold;
  const percent = Math.min(Math.round((subtotal / threshold) * 100), 100);
  return (
    <div className="free-shipping-meter">
      <p className="free-shipping-meter-text text-sm text-gray-600">
        {qualifies ? 'You qualify for free shipping!' : `Add ${formatMoney(threshold - subtotal)} more for free shipping`}
      </p>
      <div className="free-shipping-meter-track mt-1.5 h-2 rounded-full bg-mist">
        <div
          className={`free-shipping-meter-bar h-full rounded-full ${qualifies ? 'bg-green-600' : 'bg-brand-600'}`}
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
