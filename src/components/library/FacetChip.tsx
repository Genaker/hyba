/** One active filter as a removable chip — removal is a link (zero-JS). */
export default function FacetChip({ label, removeHref }: { label: string; removeHref: string }) {
  return (
    <span className="facet-chip inline-flex items-center gap-1 rounded-full bg-mist px-3 py-1 text-sm text-ink">
      {label}
      <a href={removeHref} aria-label={`Remove filter ${label}`} className="facet-chip-remove font-semibold text-gray-500 hover:text-ink">
        ×
      </a>
    </span>
  );
}
