import type { Category, CmsPage, Product } from './types';

export type RouteResolution =
  | { type: 'category'; category: Category }
  | { type: 'product'; product: Product }
  | { type: 'content'; page: CmsPage }
  | { type: 'not-found' };

/** The three lookups resolution needs — structurally satisfied by any DataProvider. */
export type RouteLookupSource = {
  getCategoryByPath(path: string): Promise<Category | null>;
  getProductBySlug(slug: string): Promise<Product | null>;
  getCmsPageBySlug(slug: string): Promise<CmsPage | null>;
};

/**
 * One resolver for the three content URL shapes (canonical ecommerce URLs):
 *   /medical/...                          → category listing
 *   /<category-path>/<product-slug>       → product detail (last segment; slug is authoritative)
 *   /orders-and-returns                   → CMS page
 * Precedence: category wins over product on a full-path match, so a product
 * slug that collides with a category path can never shadow the category.
 * Lookups fire in parallel (speculatively); precedence is applied after.
 */
export async function resolveRouteWith(source: RouteLookupSource, path: string[]): Promise<RouteResolution> {
  const fullPath = path.join('/');
  const lastSegment = path[path.length - 1];

  const [category, product, cmsPage] = await Promise.all([
    source.getCategoryByPath(fullPath),
    source.getProductBySlug(lastSegment),
    path.length === 1 ? source.getCmsPageBySlug(path[0]) : Promise.resolve(null),
  ]);

  if (category) return { type: 'category', category };
  // strict canonical URL: the prefix must be the product's real category path — anything else 404s
  if (product && path.slice(0, -1).join('/') === product.categoryPath) return { type: 'product', product };
  if (cmsPage) return { type: 'content', page: cmsPage };
  return { type: 'not-found' };
}
