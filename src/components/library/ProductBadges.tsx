/** "New" / "Featured" / "Sale" chips; renders nothing when no flag is set. */
export default function ProductBadges({ isNew = false, isFeatured = false, onSale = false }: { isNew?: boolean; isFeatured?: boolean; onSale?: boolean }) {
  const badges = [
    isNew && { key: 'new', label: 'New', classes: 'bg-brand-600 text-white' },
    isFeatured && { key: 'featured', label: 'Featured', classes: 'bg-ink text-white' },
    onSale && { key: 'sale', label: 'Sale', classes: 'bg-red-700 text-white' },
  ].filter(Boolean) as { key: string; label: string; classes: string }[];
  if (badges.length === 0) return null;
  return (
    <span className="product-badges inline-flex gap-1.5">
      {badges.map((badge) => (
        <span key={badge.key} className={`product-badge product-badge-${badge.key} rounded px-1.5 py-0.5 text-xs font-semibold ${badge.classes}`}>
          {badge.label}
        </span>
      ))}
    </span>
  );
}
