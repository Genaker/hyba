import FacetChip from './FacetChip';

export type AppliedFilter = { label: string; removeHref: string };

/** Row of active filter chips + "Clear all"; renders nothing with no filters. */
export default function AppliedFilters({ filters, clearAllHref }: { filters: AppliedFilter[]; clearAllHref: string }) {
  if (filters.length === 0) return null;
  return (
    <div className="applied-filters flex flex-wrap items-center gap-2">
      {filters.map((filter) => (
        <FacetChip key={filter.label} label={filter.label} removeHref={filter.removeHref} />
      ))}
      <a href={clearAllHref} className="applied-filters-clear text-sm text-brand-600 hover:underline">
        Clear all
      </a>
    </div>
  );
}
