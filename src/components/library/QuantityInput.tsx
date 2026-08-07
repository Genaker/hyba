/** Labeled quantity <input type=number> for form submission — no JS stepper,
 *  the native control handles increment/decrement. */
export default function QuantityInput({ name = 'quantity', defaultValue = 1, min = 1, max, label = 'Qty' }: { name?: string; defaultValue?: number; min?: number; max?: number; label?: string }) {
  return (
    <label className="quantity-input inline-flex items-center gap-2 text-sm text-ink">
      <span className="quantity-input-label font-medium">{label}</span>
      <input
        type="number"
        name={name}
        defaultValue={defaultValue}
        min={min}
        max={max}
        className="quantity-input-field w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-center"
      />
    </label>
  );
}
