'use client';

import { useRef } from 'react';

/**
 * Quantity input with −/+ steppers that auto-submit the surrounding form.
 * Without JS it renders as a number input + visible Update button.
 */
export default function QuantityStepper({ sku, quantity }: { sku: string; quantity: number }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const step = (delta: number) => {
    const input = inputRef.current;
    if (!input) return;
    input.value = String(Math.max(0, (Number(input.value) || 0) + delta));
    input.form?.requestSubmit();
  };

  return (
    <span className="qty-stepper inline-flex items-center overflow-hidden rounded-lg border border-gray-300">
      <button type="button" aria-label="Decrease quantity" onClick={() => step(-1)}
        className="qty-decrease px-2.5 py-1 text-lg leading-none hover:bg-mist">−</button>
      <input
        ref={inputRef}
        id={`qty-${sku}`}
        type="number"
        name="quantity"
        defaultValue={quantity}
        min={0}
        max={9999}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="qty-input w-14 border-x border-gray-300 px-2 py-1 text-center text-sm [appearance:textfield]"
      />
      <button type="button" aria-label="Increase quantity" onClick={() => step(1)}
        className="qty-increase px-2.5 py-1 text-lg leading-none hover:bg-mist">+</button>
    </span>
  );
}
