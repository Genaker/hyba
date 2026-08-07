export type BrandSlide = { name: string; href: string; logo: string | null };

/** Horizontal scroll-snap strip of brand tiles, zero JS. */
export default function BrandSlider({ brands }: { brands: BrandSlide[] }) {
  if (brands.length === 0) return null;
  return (
    <div className="brand-slider flex snap-x gap-4 overflow-x-auto pb-2">
      {brands.map((brand) => (
        <a key={brand.name} href={brand.href} title={brand.name} className="brand-slider-item flex h-20 w-36 shrink-0 snap-start items-center justify-center rounded-xl border border-mist p-3 hover:border-brand-500">
          {brand.logo ? <img src={brand.logo} alt={brand.name} className="brand-slider-logo max-h-full max-w-full object-contain" /> : <span className="brand-slider-name text-sm font-semibold text-ink">{brand.name}</span>}
        </a>
      ))}
    </div>
  );
}
