import type { Category, Facets, Product, ProductListResult, ProductQuery } from '../../types';
import { oroApiGet, oroApiGetOrNull, type JsonApiDocument, type JsonApiResource } from './client';
import { extractAttributeGroups, slugify } from './attributes';
import { subtreeCategoryIds } from './categories';

function escapeQueryValue(value: string): string {
  return value.replace(/"/g, '\\"');
}

function primaryUnit(unitPrecisions: { unit: string; default: boolean }[] | undefined): string {
  return unitPrecisions?.find((entry) => entry.default)?.unit ?? 'item';
}

function categoryPathFor(categoriesById: Map<number, Category>, categoryId: number | null): string {
  return categoryId !== null ? (categoriesById.get(categoryId)?.path ?? '') : '';
}

function relatedId(data: { type: string; id: string } | { type: string; id: string }[] | null | undefined): number | null {
  return data && !Array.isArray(data) ? Number(data.id) : null;
}

function isInStock(inventoryStatusRef: { type: string; id: string } | { type: string; id: string }[] | null | undefined): boolean {
  return !Array.isArray(inventoryStatusRef) && inventoryStatusRef?.id !== 'out_of_stock';
}

/**
 * Maps a `productsearch` list item — the shape used for category/search listing
 * pages. Lighter than the full `products` resource: no tiered `prices` (only
 * the unit price), no Oro-generated `url` slug, and no `featured` flag — none
 * of those are indexed fields on ProductSearch. See getProductBySlug/BySku for
 * the full-fidelity mapping used on product detail pages.
 */
function mapSearchResult(resource: JsonApiResource, categoriesById: Map<number, Category>): Product {
  const attrs = resource.attributes;
  const categoryId = relatedId(resource.relationships?.category?.data);
  const images: { url: string; type: string }[] = attrs.images ?? [];
  const minimalPrices: { price: string; currencyId: string; unit: string }[] = attrs.minimalPrices ?? [];
  const unit = primaryUnit(attrs.unitPrecisions);
  const unitPrice = minimalPrices.find((price) => price.unit === unit) ?? minimalPrices[0];

  return {
    id: Number(resource.id),
    sku: attrs.sku,
    title: attrs.name,
    // Approximation — ProductSearch doesn't return Oro's real slug (`url`), only the plain
    // `products` resource does. Correct for this demo's naming (its slugs are literally
    // slugify(name)) but not guaranteed for hand-edited/custom SEO slugs in a real catalog.
    slug: slugify(attrs.name),
    shortDescription: attrs.shortDescription ?? null,
    description: null,
    attributes: [],
    brandId: null, // gap — Brand is an admin-API-only entity, not exposed by the frontend API. See withFallback().
    brand: null,
    categoryId,
    categoryPath: categoryPathFor(categoriesById, categoryId),
    isFeatured: false, // gap — `featured` is not one of ProductSearch's indexed/queryable fields. See withFallback().
    isNewArrival: Boolean(attrs.newArrival),
    inStock: isInStock(resource.relationships?.inventoryStatus?.data),
    prices: unitPrice ? [{ quantity: 1, amount: Number(unitPrice.price), currency: unitPrice.currencyId }] : [],
    image: images.find((image) => image.type === 'medium')?.url ?? null,
    imageLarge: images.find((image) => image.type === 'large')?.url ?? null,
    // Every distinct large/medium shot the search payload carries, largest first.
    gallery: [...new Set(images.filter((image) => image.type === 'large' || image.type === 'medium').map((image) => image.url))],
    variants: [], // gap — Oro's frontend API has no configurable-product concept to map here
  };
}

function pickImageFile(files: { url: string; dimension: string }[] | undefined, dimension: string): string | null {
  return files?.find((file) => file.dimension === dimension)?.url ?? null;
}

/** Maps a full `/api/products/{id}?include=images` document — used for product detail pages. */
function mapFullProduct(document: JsonApiDocument, categoriesById: Map<number, Category>): Product {
  const resource = document.data as JsonApiResource;
  const attrs = resource.attributes;
  const { attributeGroups, cleanedDescription } = extractAttributeGroups(attrs.description ?? null);
  const categoryId = relatedId(resource.relationships?.category?.data);

  const imageResource =
    (document.included ?? []).find(
      (included) => included.type === 'productimages' && (included.attributes.types ?? []).includes('main'),
    ) ?? (document.included ?? [])[0];
  const files: { url: string; dimension: string }[] = imageResource?.attributes.files ?? [];

  const unit = primaryUnit(attrs.unitPrecisions);
  const prices: { price: string; currencyId: string; quantity: string; unit: string }[] = attrs.prices ?? [];

  return {
    id: Number(resource.id),
    sku: attrs.sku,
    title: attrs.name,
    slug: attrs.url ? String(attrs.url).replace(/^\//, '') : slugify(attrs.name),
    shortDescription: attrs.shortDescription ?? null,
    description: cleanedDescription,
    attributes: attributeGroups,
    brandId: null, // gap — Brand is an admin-API-only entity, not exposed by the frontend API. See withFallback().
    brand: null,
    categoryId,
    categoryPath: categoryPathFor(categoriesById, categoryId),
    isFeatured: Boolean(attrs.featured),
    isNewArrival: Boolean(attrs.newArrival),
    inStock: isInStock(resource.relationships?.inventoryStatus?.data),
    prices: prices
      .filter((price) => price.unit === unit)
      .map((price) => ({ quantity: Number(price.quantity), amount: Number(price.price), currency: price.currencyId }))
      .sort((a, b) => a.quantity - b.quantity),
    image: pickImageFile(files, 'product_gallery_main'),
    imageLarge: pickImageFile(files, 'product_gallery_popup'),
    // Oro's own gallery dimensions, popup (largest) first; deduped and null-free.
    gallery: [...new Set([pickImageFile(files, 'product_gallery_popup'), pickImageFile(files, 'product_gallery_main')].filter(Boolean) as string[])],
    variants: [], // gap — Oro's frontend API has no configurable-product concept to map here
  };
}

/** Builds Oro's searchQuery DSL (see ProductBundle's api_frontend/product_search.md). */
function buildSearchQuery(query: ProductQuery, categoryIds: number[] | null): string {
  const clauses: string[] = [];
  if (categoryIds) clauses.push(`category in (${categoryIds.join(',')})`);
  if (query.search) clauses.push(`allText ~ "${escapeQueryValue(query.search)}"`);
  if (query.attributes?.instock?.length) clauses.push('inventoryStatus = "in_stock"');
  if (query.attributes?.new?.length) clauses.push('newArrival = 1');
  if (query.minPrice !== undefined) clauses.push(`minimalPrice >= ${Number(query.minPrice)}`);
  if (query.maxPrice !== undefined) clauses.push(`minimalPrice <= ${Number(query.maxPrice)}`);
  return clauses.join(' and ');
}

const sortFieldMap: Record<string, string> = { name: 'name', sku: 'sku', price: 'minimalPrice', newest: 'newArrival' };

function buildSort(query: ProductQuery): string {
  const field = sortFieldMap[query.sort ?? 'name'] ?? 'name';
  return query.dir === 'desc' ? `-${field}` : field;
}

/**
 * Facet counts, simplified vs raw.ts's `buildFacets`: this issues one
 * combined-filter aggregation call (not one call per facet with that facet's
 * own filter excluded), so a checked "In stock only" box won't show the
 * "if unchecked" count. Subcategory counts are exact (one productsearch call
 * per direct child, each scoped to that child's own subtree). No Brand or
 * Featured group — neither has a live equivalent at all; withFallback()
 * merges those in from the raw provider's own facet computation instead of
 * this file re-implementing them.
 */
async function buildFacets(query: ProductQuery, categoryIds: number[] | null, categories: Category[]): Promise<Facets> {
  const searchQuery = buildSearchQuery(query, categoryIds);
  const aggregations = 'newArrival count,inventoryStatus count,minimalPrice min minPrice,minimalPrice max maxPrice';
  const document = await oroApiGet('/api/productsearch', {
    ...(searchQuery ? { 'filter[searchQuery]': searchQuery } : {}),
    'filter[aggregations]': aggregations,
    'page[size]': '1',
  });
  const aggregated = document.meta?.aggregatedData ?? {};

  const groups: any[] = [];
  const newCount = ((aggregated.newArrivalCount ?? []) as { value: unknown; count: number }[]).find(
    (entry) => entry.value === 1 || entry.value === true,
  )?.count;
  if (newCount) groups.push({ key: 'new', label: 'Highlights', type: 'boolean', options: [{ value: '1', label: 'New Arrival', count: newCount }] });

  const inStockCount = ((aggregated.inventoryStatusCount ?? []) as { value: unknown; count: number }[]).find(
    (entry) => entry.value === 'in_stock',
  )?.count;
  if (inStockCount) groups.push({ key: 'instock', label: 'Availability', type: 'boolean', options: [{ value: '1', label: 'In stock only', count: inStockCount }] });

  const parentCategory = query.categoryPath ? categories.find((category) => category.path === query.categoryPath) : null;
  const childCategories = parentCategory ? categories.filter((category) => category.parentId === parentCategory.id) : [];
  const subcategoryEntries = await Promise.all(
    childCategories.map(async (category) => {
      const childSearchQuery = buildSearchQuery(query, subtreeCategoryIds(categories, category.path));
      const countDocument = await oroApiGet('/api/productsearch', { 'filter[searchQuery]': childSearchQuery, 'page[size]': '1' });
      return { category, count: countDocument.meta?.totalCount ?? 0 };
    }),
  );

  return {
    groups,
    subcategories: subcategoryEntries.filter((entry) => entry.count > 0),
    priceMin: aggregated.minPrice !== undefined ? Math.floor(aggregated.minPrice) : 0,
    priceMax: aggregated.maxPrice !== undefined ? Math.ceil(aggregated.maxPrice) : 0,
  };
}

export async function searchProducts(query: ProductQuery, categories: Category[]): Promise<ProductListResult> {
  const categoriesById = new Map(categories.map((category) => [category.id, category]));
  const categoryIds = query.categoryPath ? subtreeCategoryIds(categories, query.categoryPath) : null;
  const pageSize = query.pageSize ?? 12;
  const page = Math.max(1, query.page ?? 1);

  const searchQuery = buildSearchQuery(query, categoryIds);
  const listDocument = await oroApiGet('/api/productsearch', {
    ...(searchQuery ? { 'filter[searchQuery]': searchQuery } : {}),
    sort: buildSort(query),
    'page[size]': String(pageSize),
    'page[number]': String(page),
  });

  const items = (Array.isArray(listDocument.data) ? listDocument.data : []).map((resource) => mapSearchResult(resource, categoriesById));
  const total = listDocument.meta?.totalCount ?? items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const facets = await buildFacets(query, categoryIds, categories);

  return { items, total, page, pageSize, totalPages, facets };
}

async function fetchFullProduct(apiPath: string, categories: Category[]): Promise<Product | null> {
  const document = await oroApiGetOrNull(apiPath, { include: 'images' });
  if (!document || !document.data) return null;
  const categoriesById = new Map(categories.map((category) => [category.id, category]));
  return mapFullProduct(document, categoriesById);
}

/** Resolves a storefront slug via Oro's route resolver (RedirectBundle) — the same mechanism Oro's own storefront uses for its catch-all URL. */
export async function findProductBySlug(slug: string, categories: Category[]): Promise<Product | null> {
  const routeId = `:${slug.replace(/\//g, ':')}`;
  const routeDocument = await oroApiGetOrNull(`/api/routes/${encodeURIComponent(routeId)}`);
  const routeResource = routeDocument?.data as JsonApiResource | undefined;
  if (!routeResource || routeResource.attributes.resourceType !== 'product') return null;
  return fetchFullProduct(routeResource.attributes.apiUrl, categories);
}

export async function findProductBySku(sku: string, categories: Category[]): Promise<Product | null> {
  const document = await oroApiGet('/api/products', { 'filter[sku]': sku, include: 'images', 'page[size]': '1' });
  const resource = Array.isArray(document.data) ? document.data[0] : document.data;
  if (!resource) return null;
  const categoriesById = new Map(categories.map((category) => [category.id, category]));
  return mapFullProduct({ data: resource, included: document.included }, categoriesById);
}

export async function findRelatedProducts(product: Product, limit: number, categories: Category[]): Promise<Product[]> {
  if (product.categoryId === null) return [];
  const categoriesById = new Map(categories.map((category) => [category.id, category]));
  const document = await oroApiGet('/api/productsearch', {
    'filter[searchQuery]': `category = ${product.categoryId} and id != ${product.id}`,
    'page[size]': String(limit),
  });
  return (Array.isArray(document.data) ? document.data : []).map((resource) => mapSearchResult(resource, categoriesById));
}
