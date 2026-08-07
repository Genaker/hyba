import type {
  Category,
  CmsContent,
  CmsPage,
  MenuItem,
  Product,
  ProductListResult,
  Slide,
  User,
} from '../types';
import type { DataProvider } from './index';

/**
 * The gateway-backed provider — a STATELESS API client, one gateway call per
 * DataProvider method. The storefront knows nothing about the data: no
 * datasets in memory, no lookups, no menu building, no facet registries —
 * everything resolves on the gateway (custom/lib/catalog-engine.ts) and this
 * file just transports typed requests/responses. The gateway is the ONLY
 * data source: no bundled fallback, a down gateway means pages 500, by design.
 */

function gatewayBaseUrl(): string {
  return process.env.GATEWAY_URL ?? 'http://127.0.0.1:8090';
}

async function unwrap<T>(responsePromise: Promise<Response>, path: string): Promise<T> {
  let response: Response;
  try {
    response = await responsePromise;
  } catch (error) {
    throw new Error(`gateway unreachable at ${gatewayBaseUrl()} (${error}) — is the gateway running? See gateway/README.md.`);
  }
  if (!response.ok) throw new Error(`gateway ${path} → ${response.status}`);
  return (await response.json()).data as T;
}

/**
 * Catalog data changes only when an extraction script rewrites a dataset file,
 * so reads go through Next's data cache instead of hitting the gateway on every
 * render. Reference data (menu, categories, CMS) gets a long window; product
 * queries a short one. Auth lookups opt out entirely — see gatewayGetFresh.
 */
const REFERENCE_TTL_SECONDS = 300;
const CATALOG_TTL_SECONDS = 60;

function gatewayGet<T>(path: string, revalidate: number = CATALOG_TTL_SECONDS): Promise<T> {
  return unwrap<T>(fetch(`${gatewayBaseUrl()}${path}`, { next: { revalidate } }), path);
}

/** Never cached: a user lookup must reflect the live record (login, session). */
function gatewayGetFresh<T>(path: string): Promise<T> {
  return unwrap<T>(fetch(`${gatewayBaseUrl()}${path}`, { cache: 'no-store' }), path);
}

function gatewayPost<T>(path: string, body: unknown): Promise<T> {
  return unwrap<T>(
    fetch(`${gatewayBaseUrl()}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    }),
    path,
  );
}

export function createGatewayProvider(dataset: string): DataProvider {
  const catalog = (path: string) => `/api/catalog/${dataset}${path}`;

  return {
    getCategories: () => gatewayGet<Category[]>(`/api/dataset/${dataset}/categories`, REFERENCE_TTL_SECONDS),
    getMenu: () => gatewayGet<MenuItem[]>(catalog('/menu'), REFERENCE_TTL_SECONDS),
    getCategoryByPath: (path) => gatewayGet<Category | null>(catalog(`/category?path=${encodeURIComponent(path)}`), REFERENCE_TTL_SECONDS),
    getProducts: (query) => gatewayGet<ProductListResult>(catalog(`/products?query=${encodeURIComponent(JSON.stringify(query))}`)),
    getProductBySlug: (slug) => gatewayGet<Product | null>(catalog(`/product?slug=${encodeURIComponent(slug)}`)),
    getProductBySku: (sku) => gatewayGet<Product | null>(catalog(`/product?sku=${encodeURIComponent(sku)}`)),
    getVariantOptions: (sku) => gatewayGet<{ label: string; value: string }[]>(catalog(`/variant-options?sku=${encodeURIComponent(sku)}`)),
    getRelatedProducts: (product, limit) =>
      gatewayGet<Product[]>(catalog(`/related?id=${product.id}&categoryPath=${encodeURIComponent(product.categoryPath)}&limit=${limit}`)),
    getRecommendations: (product, options) =>
      gatewayGet<{ mode: 'semantic' | 'standard'; items: Product[] }>(
        catalog(
          `/recommendations?id=${product.id}&categoryPath=${encodeURIComponent(product.categoryPath)}` +
            `&flavor=${options.flavor}&mode=${options.mode ?? 'auto'}&limit=${options.limit ?? 5}`,
        ),
      ),
    getCmsPageBySlug: (slug) => gatewayGet<CmsPage | null>(catalog(`/cms-page?slug=${encodeURIComponent(slug)}`), REFERENCE_TTL_SECONDS),
    getCmsContentById: (id) => gatewayGet<CmsContent | null>(`/api/cms-content/${encodeURIComponent(id)}?dataset=${dataset}`, REFERENCE_TTL_SECONDS),
    getSlides: () => gatewayGet<Slide[]>(`/api/dataset/${dataset}/slides`, REFERENCE_TTL_SECONDS),
    // POST body, never query params — credentials must stay out of the gateway's access log
    findUser: (email, password) => gatewayPost<User | null>(`/api/auth/${dataset}/login`, { email, password }),
    getUserByEmail: (email) => gatewayGetFresh<User | null>(`/api/auth/${dataset}/user?email=${encodeURIComponent(email)}`),
  };
}
