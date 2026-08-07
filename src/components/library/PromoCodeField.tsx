/** Coupon input + apply button; posts to `action` (server action or route). */
export default function PromoCodeField({ action, defaultValue = '', error }: { action: string; defaultValue?: string; error?: string }) {
  return (
    <form action={action} method="post" className="promo-code-field">
      <div className="promo-code-controls flex gap-2">
        <input
          type="text"
          name="promoCode"
          defaultValue={defaultValue}
          placeholder="Promo code"
          className="promo-code-input flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <button type="submit" className="promo-code-apply rounded-lg border border-ink px-4 py-2 text-sm font-semibold hover:bg-mist">
          Apply
        </button>
      </div>
      {error && <p className="promo-code-error mt-1 text-sm text-red-700">{error}</p>}
    </form>
  );
}
