import Link from 'next/link';
import type { Product, ProductListResult, ProductQuery } from '@/lib/types';
import type { Dictionary } from '@/lib/i18n';
import { getDictionary } from '@/lib/i18n';
import { formatMoney } from '@/lib/format';
import ProductTile from './ProductTile';
import ProductRow from './ProductRow';
import SortSelect from './SortSelect';
import { categoryUrl } from '@/lib/urls';

const facetParamPrefix = 'f_';   // URL params f_<key>=value1,value2 — any facet key works, nothing hardcoded

/** Parses list-page search params (filters, sort, page) into a ProductQuery. */
export function parseListParams(searchParams: Record<string, string | string[] | undefined>): Partial<ProductQuery> {
  const single = (key: string) => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value;
  };
  // sort accepts "price" or the dropdown's combined "price:desc"
  const [sortKey, sortDir] = (single('sort') ?? '').split(':');

  const attributes: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(searchParams)) {
    if (!key.startsWith(facetParamPrefix)) continue;
    const single_ = Array.isArray(value) ? value[0] : value;
    if (single_) attributes[key.slice(facetParamPrefix.length)] = single_.split(',').filter(Boolean);
  }

  return {
    attributes: Object.keys(attributes).length ? attributes : undefined,
    minPrice: single('min') ? Number(single('min')) : undefined,
    maxPrice: single('max') ? Number(single('max')) : undefined,
    sort: (sortKey as ProductQuery['sort']) || undefined,
    dir: sortDir === 'desc' || single('dir') === 'desc' ? 'desc' : undefined,
    page: single('page') ? Number(single('page')) : undefined,
  };
}

/** Builds a URL for the current page with some params changed (null = remove). */
function buildUrl(basePath: string, current: URLSearchParams, changes: Record<string, string | null>): string {
  const params = new URLSearchParams(current);
  for (const [key, value] of Object.entries(changes)) {
    if (value === null) params.delete(key);
    else params.set(key, value);
  }
  params.delete('page');            // filter/sort changes reset pagination
  if (changes.page) params.set('page', changes.page);
  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

function activeFacetValues(params: URLSearchParams, key: string): string[] {
  return (params.get(`${facetParamPrefix}${key}`) ?? '').split(',').filter(Boolean);
}

/** Toggle URL for one facet option — works for any facet key, checkbox (multi) or boolean (single). */
function toggleFacetUrl(basePath: string, params: URLSearchParams, group: any, value: string): string {
  const current = activeFacetValues(params, group.key);
  const isActive = current.includes(value);
  const next = isActive
    ? current.filter((candidate) => candidate !== value)
    : group.type === 'checkbox' ? [...current, value] : [value];
  return buildUrl(basePath, params, { [`${facetParamPrefix}${group.key}`]: next.length ? next.join(',') : null });
}

function toSearchParams(raw: Record<string, string | string[] | undefined>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    const single = Array.isArray(value) ? value[0] : value;
    if (single) params.set(key, single);
  }
  return params;
}

function sortChoices(t: Dictionary['listing']) {
  return [
    { value: 'name', label: t.sortNameAsc },
    { value: 'name:desc', label: t.sortNameDesc },
    { value: 'price', label: t.sortPriceAsc },
    { value: 'price:desc', label: t.sortPriceDesc },
    { value: 'sku', label: t.sortSku },
    { value: 'newest', label: t.sortNewest },
  ];
}

function viewOptions(t: Dictionary['listing']) {
  return [
    { key: 'grid', label: t.gridView, symbol: '▦' },
    { key: 'list', label: t.listView, symbol: '☰' },
    { key: 'compact', label: t.compactView, symbol: '≡' },
  ];
}

function GridView({ products, dictionary }: { products: Product[]; dictionary: Dictionary }) {
  return (
    <ul className="products-grid grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {products.map((product, index) => (
        <li key={product.id} className="products-grid-item">
          <ProductTile product={product} dictionary={dictionary} priority={index < 4} />
        </li>
      ))}
    </ul>
  );
}

function ListView({ products, dictionary }: { products: Product[]; dictionary: Dictionary }) {
  return (
    <ul className="products-list space-y-3">
      {products.map((product) => (
        <li key={product.id} className="products-list-item">
          <ProductRow product={product} dictionary={dictionary} />
        </li>
      ))}
    </ul>
  );
}

function CompactView({ products, dictionary }: { products: Product[]; dictionary: Dictionary }) {
  return (
    <ul className="products-compact divide-y divide-mist rounded-xl border border-mist px-4">
      {products.map((product) => (
        <li key={product.id} className="products-compact-item">
          <ProductRow product={product} dictionary={dictionary} compact />
        </li>
      ))}
    </ul>
  );
}

/** Chevron for filter-group <summary> toggles — CSS (not JS) flips it via details[open]. */
function ChevronIcon({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={`filter-title-chevron-icon shrink-0 stroke-current transition-transform ${className}`} fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 8 4 4 4-4" />
    </svg>
  );
}

/** One clickable facet option row — a checkbox-styled toggle link, no client JS. */
function FacetOptionRow({ basePath, params, group, option }: {
  basePath: string;
  params: URLSearchParams;
  group: any;                       // raw facet group JSON, shape not enforced
  option: any;                      // { value, label, count }
}) {
  const isActive = activeFacetValues(params, group.key).includes(option.value);
  return (
    <Link
      href={toggleFacetUrl(basePath, params, group, option.value)}
      className={`filter-option flex items-center gap-2 ${isActive ? 'font-semibold text-brand-600' : 'text-gray-600 hover:text-brand-600'}`}
    >
      <span aria-hidden className={`filter-option-checkbox inline-block h-4 w-4 rounded border ${isActive ? 'border-brand-600 bg-brand-600' : 'border-gray-300'}`} />
      {option.label} <span className="filter-option-count text-gray-500">({option.count})</span>
    </Link>
  );
}

export default async function ProductListing({
  result,
  basePath,
  rawParams,
}: {
  result: ProductListResult;
  basePath: string;
  rawParams: Record<string, string | string[] | undefined>;
}) {
  const dictionary = await getDictionary();
  const { listing: t } = dictionary;
  const views = viewOptions(t);
  const params = toSearchParams(rawParams);
  const activeSort = params.get('sort') ?? 'name';
  const activeView = views.some((option) => option.key === params.get('view')) ? params.get('view')! : 'grid';
  const { facets } = result;

  // checkbox groups (e.g. Brand) get their own section; boolean groups (e.g.
  // In Stock, Featured) are single-option toggles, grouped by shared label
  // (Availability / Highlights) — this stays generic to whatever the provider defines.
  const checkboxGroups = facets.groups.filter((group: any) => group.type === 'checkbox');
  const booleanSections = new Map<string, any[]>();
  for (const group of facets.groups.filter((group: any) => group.type === 'boolean')) {
    booleanSections.set(group.label, [...(booleanSections.get(group.label) ?? []), group]);
  }

  const activeFilterCount =
    facets.groups.reduce((sum, group) => sum + (activeFacetValues(params, group.key).length > 0 ? 1 : 0), 0) +
    (params.get('min') || params.get('max') ? 1 : 0);
  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div className="product-listing grid gap-4 lg:grid-cols-[240px_1fr] lg:gap-8">
      {/* Mobile-only toggle (checkbox-hack, zero JS — same pattern as the mega-menu
          hamburger): filters are collapsed by default on mobile since a full-width
          facet sidebar pushed the product grid off-screen; always open on lg+. */}
      <input type="checkbox" id="filter-toggle" className="filter-toggle-checkbox peer hidden" />
      <label
        htmlFor="filter-toggle"
        className="filter-toggle flex cursor-pointer items-center justify-between rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium lg:hidden"
      >
        <span className="filter-toggle-label flex items-center gap-2">
          <svg aria-hidden viewBox="0 0 20 20" className="filter-toggle-icon h-4 w-4 stroke-current" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 5h14M6 10h8M8.5 15h3" />
          </svg>
          {t.filters}
          {hasActiveFilters && <span className="filter-toggle-count rounded-full bg-brand-600 px-1.5 py-0.5 text-xs font-semibold text-white">{activeFilterCount}</span>}
        </span>
        <svg aria-hidden viewBox="0 0 20 20" className="filter-toggle-chevron h-4 w-4 shrink-0 stroke-current transition-transform" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 8 4 4 4-4" />
        </svg>
      </label>

      {/* Facet sidebar — plain links and a GET form; no client JS */}
      <aside aria-label="Filters" className="filter-options hidden space-y-6 peer-checked:block lg:block">
        {hasActiveFilters && (
          <Link href={basePath} className="filter-clear inline-block text-sm font-medium text-brand-600 underline">
            {t.clearAllFilters}
          </Link>
        )}

        {facets.subcategories.length > 0 && (
          <section className="filter-categories">
            <h2 className="filter-title mb-2 text-sm font-semibold uppercase tracking-wide">{t.subCategories}</h2>
            <ul className="filter-categories-items space-y-1.5 text-sm">
              {facets.subcategories.map(({ category, count }) => (
                <li key={category.id} className="filter-categories-item">
                  <Link href={categoryUrl(category)} className="filter-option text-gray-600 hover:text-brand-600">
                    {category.title} <span className="filter-option-count text-gray-500">({count})</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {checkboxGroups.map((group: any) => (
          <details key={group.key} open className="filter-group">
            <summary role="heading" aria-level={2} className="filter-title mb-2 flex list-none items-center justify-between text-sm font-semibold uppercase tracking-wide [&::-webkit-details-marker]:hidden">
              {group.label}
              <ChevronIcon className="filter-title-chevron h-3.5 w-3.5 text-gray-400" />
            </summary>
            <ul className="filter-group-items space-y-1.5 text-sm">
              {group.options.map((option: any) => (
                <li key={option.value} className="filter-group-item">
                  <FacetOptionRow basePath={basePath} params={params} group={group} option={option} />
                </li>
              ))}
            </ul>
          </details>
        ))}

        <section className="filter-group">
          <h2 className="filter-title mb-2 text-sm font-semibold uppercase tracking-wide">{t.price}</h2>
          {/* flex-wrap: long Apply labels (e.g. uk "Застосувати") drop to their own line instead of overflowing the sidebar */}
          <form action={basePath} className="filter-price flex flex-wrap items-center gap-2 text-sm">
            {[...params.entries()]
              .filter(([key]) => !['min', 'max', 'page'].includes(key))
              .map(([key, value]) => (
                <input key={key} className="filter-price-param" type="hidden" name={key} value={value} />
              ))}
            <label className="filter-price-label sr-only" htmlFor="price-min">Minimum price</label>
            <input
              id="price-min" name="min" type="number" min={0}
              defaultValue={params.get('min') ?? ''} placeholder={String(facets.priceMin)}
              className="filter-price-input w-20 rounded-lg border border-gray-300 px-2 py-1.5"
            />
            <span aria-hidden className="filter-price-separator">–</span>
            <label className="filter-price-label sr-only" htmlFor="price-max">Maximum price</label>
            <input
              id="price-max" name="max" type="number" min={0}
              defaultValue={params.get('max') ?? ''} placeholder={String(facets.priceMax)}
              className="filter-price-input w-20 rounded-lg border border-gray-300 px-2 py-1.5"
            />
            <button type="submit" className="filter-price-apply rounded-lg border border-brand-600 px-3 py-1.5 font-medium text-brand-600 hover:bg-brand-50">
              {t.priceGo}
            </button>
          </form>
        </section>

        {[...booleanSections].map(([label, groups]) => (
          <details key={label} open className="filter-group">
            <summary role="heading" aria-level={2} className="filter-title mb-2 flex list-none items-center justify-between text-sm font-semibold uppercase tracking-wide [&::-webkit-details-marker]:hidden">
              {label}
              <ChevronIcon className="filter-title-chevron h-3.5 w-3.5 text-gray-400" />
            </summary>
            <ul className="filter-group-items space-y-1.5 text-sm">
              {groups.map((group) => (
                <li key={group.key} className="filter-group-item">
                  <FacetOptionRow basePath={basePath} params={params} group={group} option={group.options[0]} />
                </li>
              ))}
            </ul>
          </details>
        ))}
      </aside>

      <div className="products-content">
        <div className="toolbar mb-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="toolbar-count text-gray-600">{t.itemsCount(result.total)}</p>
          <div className="sorter flex items-center gap-4">
            <SortSelect
              basePath={basePath}
              choices={sortChoices(t)}
              current={params.get('dir') === 'desc' ? `${activeSort}:desc` : activeSort}
              hiddenParams={[...params.entries()].filter(([key]) => !['sort', 'dir', 'page'].includes(key))}
            />
            <nav aria-label={t.viewMode} className="view-modes flex items-center rounded-lg border border-gray-300">
              {views.map((option) => (
                <Link
                  key={option.key}
                  href={buildUrl(basePath, params, { view: option.key === 'grid' ? null : option.key })}
                  aria-label={option.label}
                  aria-current={activeView === option.key ? 'true' : undefined}
                  title={option.label}
                  className={`view-mode px-2.5 py-1.5 text-base leading-none first:rounded-l-lg last:rounded-r-lg ${
                    activeView === option.key ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-mist'
                  }`}
                >
                  <span aria-hidden className="view-mode-icon">{option.symbol}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {result.items.length === 0 ? (
          <p className="products-empty rounded-xl bg-mist p-10 text-center text-gray-600">{t.noProducts}</p>
        ) : activeView === 'list' ? (
          <ListView products={result.items} dictionary={dictionary} />
        ) : activeView === 'compact' ? (
          <CompactView products={result.items} dictionary={dictionary} />
        ) : (
          <GridView products={result.items} dictionary={dictionary} />
        )}

        {result.totalPages > 1 && (
          <nav aria-label={t.pagination} className="pages mt-8 flex justify-center gap-1 text-sm">
            {Array.from({ length: result.totalPages }, (_, index) => index + 1).map((pageNumber) => (
              <Link
                key={pageNumber}
                href={buildUrl(basePath, params, { page: String(pageNumber) })}
                aria-current={pageNumber === result.page ? 'page' : undefined}
                className={`pages-item rounded-lg px-3.5 py-2 ${pageNumber === result.page ? 'pages-item-current bg-brand-600 font-semibold text-white' : 'border border-gray-300 hover:bg-mist'}`}
              >
                {pageNumber}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}

export function listSummary(result: ProductListResult): string {
  return `${result.total} products, prices ${formatMoney(result.facets.priceMin)}–${formatMoney(result.facets.priceMax)}`;
}
