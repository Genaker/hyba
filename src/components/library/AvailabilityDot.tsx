const dotColors = { available: 'bg-green-500', limited: 'bg-amber-500', unavailable: 'bg-red-500' } as const;

/** Colored status dot + label, for compact rows (order lists, store pickers). */
export default function AvailabilityDot({ status, label }: { status: keyof typeof dotColors; label: string }) {
  return (
    <span className="availability-dot inline-flex items-center gap-1.5 text-sm text-gray-600">
      <span aria-hidden className={`availability-dot-marker h-2 w-2 rounded-full ${dotColors[status]}`} />
      {label}
    </span>
  );
}
