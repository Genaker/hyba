export type IndexedBrand = { name: string; href: string };

/** A–Z brand directory: letter jump-nav + grouped lists, zero JS. */
export default function BrandAlphabetIndex({ brands, idPrefix = 'brands' }: { brands: IndexedBrand[]; idPrefix?: string }) {
  const groups = new Map<string, IndexedBrand[]>();
  for (const brand of [...brands].sort((a, b) => a.name.localeCompare(b.name))) {
    const letter = /^[a-z]/i.test(brand.name) ? brand.name[0].toUpperCase() : '#';
    groups.set(letter, [...(groups.get(letter) ?? []), brand]);
  }
  const letters = [...groups.keys()];
  return (
    <div className="brand-alphabet-index">
      <nav aria-label="Brands by letter" className="brand-alphabet-nav flex flex-wrap gap-1.5">
        {letters.map((letter) => (
          <a key={letter} href={`#${idPrefix}-${letter}`} className="brand-alphabet-letter rounded px-2 py-1 text-sm font-semibold text-brand-600 hover:bg-mist">
            {letter}
          </a>
        ))}
      </nav>
      {letters.map((letter) => (
        <section key={letter} id={`${idPrefix}-${letter}`} className="brand-alphabet-group mt-6">
          <h3 className="brand-alphabet-heading border-b border-mist pb-1 text-lg font-bold text-ink">{letter}</h3>
          <ul className="brand-alphabet-list mt-2 grid grid-cols-2 gap-1 sm:grid-cols-4">
            {groups.get(letter)!.map((brand) => (
              <li key={brand.name}>
                <a href={brand.href} className="brand-alphabet-link text-sm text-gray-600 hover:text-ink hover:underline">
                  {brand.name}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
