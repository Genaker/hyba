import type { Category, CmsPage, MenuItem, User } from '../../types';
import type { DataProvider } from '../index';
import { oroApiGetOrNull, type JsonApiResource } from './client';
import { fetchCategories } from './categories';
import { searchProducts, findProductBySlug, findProductBySku, findRelatedProducts } from './products';

export { isOroApiConfigured } from './client';

// Icon names per top-level category slug — mirrors raw.ts; Oro's frontend API has no concept of a nav icon.
const categoryIcons: Record<string, string> = {
  'lighting-products': 'bulb',
  medical: 'cross',
  'office-furniture': 'chair',
  'retail-supplies': 'tag',
};

function categoryMenuItem(category: Category, allCategories: Category[]): MenuItem {
  return {
    title: category.title,
    url: `/${category.path}`,
    icon: categoryIcons[category.slug] ?? null,
    image: null, // gap — see withFallback(), which fills this in from the raw provider's own getMenu()
    children: allCategories.filter((child) => child.parentId === category.id).map((child) => categoryMenuItem(child, allCategories)),
  };
}

function buildMenu(categories: Category[]): MenuItem[] {
  const topCategories = categories.filter((category) => category.level === 1);
  return [
    ...topCategories.map((category) => categoryMenuItem(category, categories)),
    // No "By Brand" column — Brand is an admin-API-only entity, not exposed by Oro's frontend REST
    // API. withFallback() splices raw.ts's "By Brand" entry back in.
    { title: 'New Arrivals', url: '/product/search?sort=newest', icon: 'sparkle', image: null, children: [] },
  ];
}

function mapCmsPage(resource: JsonApiResource): CmsPage {
  const url: string | null = resource.attributes.url;
  return {
    id: Number(resource.id),
    title: resource.attributes.title,
    slug: (url ?? '').replace(/^\//, ''),
    content: resource.attributes.content,
  };
}

export const oroApiProvider: DataProvider = {
  async getCategories() {
    return fetchCategories();
  },

  async getCategoryByPath(path) {
    const categories = await fetchCategories();
    return categories.find((category) => category.path === path) ?? null;
  },

  async getMenu() {
    return buildMenu(await fetchCategories());
  },

  async getProducts(query) {
    return searchProducts(query, await fetchCategories());
  },

  async getProductBySlug(slug) {
    return findProductBySlug(slug, await fetchCategories());
  },

  async getProductBySku(sku) {
    return findProductBySku(sku, await fetchCategories());
  },

  async getVariantOptions() {
    return []; // gap — Oro's frontend API has no configurable-product concept
  },

  async getRelatedProducts(product, limit) {
    return findRelatedProducts(product, limit, await fetchCategories());
  },

  async getRecommendations(product, options) {
    // Gap — no embeddings for the live-Oro path; always the standard engine.
    const items = await this.getRelatedProducts(product, options.limit ?? 5);
    return { mode: 'standard' as const, items };
  },

  async getCmsPageBySlug(slug) {
    const routeId = `:${slug.replace(/\//g, ':')}`;
    const routeDocument = await oroApiGetOrNull(`/api/routes/${encodeURIComponent(routeId)}`);
    const routeResource = routeDocument?.data as JsonApiResource | undefined;
    if (!routeResource || routeResource.attributes.resourceType !== 'landing_page') return null;
    const pageDocument = await oroApiGetOrNull(routeResource.attributes.apiUrl);
    const pageResource = pageDocument?.data as JsonApiResource | undefined;
    return pageResource ? mapCmsPage(pageResource) : null;
  },

  async getCmsContentById(_id) {
    // Gap — Oro's Content Block entity isn't exposed by the frontend REST API;
    // withFallback() serves the extracted cms-content.json instead.
    return null;
  },

  async getSlides() {
    // Gap — the CMS ImageSlide entity has no Resources/config/oro/api_frontend.yml anywhere in
    // Oro, i.e. it is not exposed by the frontend REST API at all. withFallback() serves the
    // extracted slides.json instead when this comes back empty.
    return [];
  },

  async findUser(_email, _password): Promise<User | null> {
    // Not implemented by design, not oversight — see README "Going live against Oro". Real
    // authentication for a customer belongs on the OAuth2 password grant (username/password ==
    // the customer's real Oro credentials), which returns a *token*, not a User to compare
    // against — the whole session model (session.ts's "email in a cookie") needs to change to
    // "Oro access/refresh token in a cookie" for this to work, which is beyond DataProvider's
    // interface. withFallback() catches this throw and delegates to the raw provider's demo
    // login instead, so login keeps working (against the demo user list) until that's built.
    throw new Error('oroApiProvider.findUser is not implemented — see README "Going live against Oro".');
  },

  async getUserByEmail(_email): Promise<User | null> {
    // Not implemented by design — Oro's frontend API only exposes `/api/customerusers/mine`
    // (the caller's own record, resolved from their bearer token), not lookup-by-email. The raw
    // provider's session model (an email in a plain cookie, re-resolved to a User on every
    // request with no re-auth) has no live-Oro equivalent: there's no token to send. A real
    // migration stores an Oro access token in the session cookie instead of an email, and this
    // method goes away in favor of calling `/api/customerusers/mine` with that token.
    throw new Error('oroApiProvider.getUserByEmail is not implemented — see README "Going live against Oro".');
  },
};
