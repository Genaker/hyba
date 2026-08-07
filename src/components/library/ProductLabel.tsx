const positionClasses = {
  'top-left': 'top-2 left-2',
  'top-right': 'top-2 right-2',
  'bottom-left': 'bottom-2 left-2',
  'bottom-right': 'bottom-2 right-2',
} as const;

const variantClasses = { sale: 'bg-red-700 text-white', new: 'bg-brand-600 text-white', neutral: 'bg-ink text-white' } as const;

/** Corner label overlaid on a product image — the parent needs `relative`. */
export default function ProductLabel({ text, position = 'top-left', variant = 'neutral' }: { text: string; position?: keyof typeof positionClasses; variant?: keyof typeof variantClasses }) {
  return (
    <span className={`product-label product-label-${variant} absolute z-10 rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${positionClasses[position]} ${variantClasses[variant]}`}>
      {text}
    </span>
  );
}
