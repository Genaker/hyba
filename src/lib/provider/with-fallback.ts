import type { DataProvider } from './index';
import type { MenuItem, Product } from '../types';

/**
 * Wraps any DataProvider so that whatever it structurally can't supply falls
 * back to another provider. Not Oro-specific — generic composition, usable
 * by any live provider that only partially implements the interface.
 *
 * Three shapes of fallback:
 *  - Whole-result: primary throws, or returns an empty/null result where the
 *    fallback has something (getSlides, findUser, getUserByEmail, and the
 *    null case of getCategoryByPath/getProductBySlug/getProductBySku/
 *    getCmsPageBySlug).
 *  - Field-level: primary returns a real Product but with individual fields
 *    it structurally can't populate (brandId/brand/isFeatured for the live
 *    Oro provider) — filled in from the fallback's matching record by SKU.
 *  - Facet-group-level: getProducts merges in any facet group (by `key`)
 *    the primary's result doesn't have but the fallback's equivalent query
 *    does (e.g. a "brand" or "featured" group the primary can't compute).
 *
 * Assumes the fallback provider is cheap to call speculatively/redundantly
 * (true for `rawOroDataProvider`/`rawMagentoDataProvider` — in-memory JSON, no I/O). A network-backed
 * fallback would need this to be more conservative about when it calls out.
 */
export function withFallback(primary: DataProvider, fallback: DataProvider): DataProvider {
  function fillProduct(product: Product, reference: Product | null): Product {
    if (!reference) return product;
    return {
      ...product,
      brandId: product.brandId ?? reference.brandId,
      brand: product.brand ?? reference.brand,
      isFeatured: product.isFeatured || reference.isFeatured,
    };
  }

  async function enrichProduct(product: Product | null): Promise<Product | null> {
    if (!product) return null;
    if (product.brandId !== null && product.isFeatured) return product; // nothing missing to fill in
    const reference = await fallback.getProductBySku(product.sku).catch(() => null);
    return fillProduct(product, reference);
  }

  async function enrichProducts(products: Product[]): Promise<Product[]> {
    return Promise.all(products.map(enrichProduct)) as Promise<Product[]>;
  }

  return {
    async getCategories() {
      try {
        return await primary.getCategories();
      } catch {
        return fallback.getCategories();
      }
    },

    async getCategoryByPath(path) {
      try {
        return (await primary.getCategoryByPath(path)) ?? fallback.getCategoryByPath(path);
      } catch {
        return fallback.getCategoryByPath(path);
      }
    },

    async getMenu() {
      const [primaryMenu, fallbackMenu] = await Promise.all([
        primary.getMenu().catch(() => [] as MenuItem[]),
        fallback.getMenu().catch(() => [] as MenuItem[]),
      ]);
      if (primaryMenu.length === 0) return fallbackMenu;

      // fallback's ordering is the template (e.g. it has a "By Brand" column primary doesn't);
      // primary's entries win when both have one, but inherit fallback's image if primary lacks it.
      const remainingPrimary = new Map(primaryMenu.map((item) => [item.title, item]));
      const merged = fallbackMenu.map((fallbackItem) => {
        const primaryItem = remainingPrimary.get(fallbackItem.title);
        if (!primaryItem) return fallbackItem;
        remainingPrimary.delete(fallbackItem.title);
        return { ...primaryItem, image: primaryItem.image ?? fallbackItem.image };
      });
      return [...merged, ...remainingPrimary.values()];
    },

    async getProducts(query) {
      const primaryResult = await primary.getProducts(query);
      const [items, fallbackResult] = await Promise.all([
        enrichProducts(primaryResult.items),
        fallback.getProducts(query).catch(() => null),
      ]);

      const primaryFacetKeys = new Set(primaryResult.facets.groups.map((group: any) => group.key));
      const extraGroups = (fallbackResult?.facets.groups ?? []).filter((group: any) => !primaryFacetKeys.has(group.key));

      return {
        ...primaryResult,
        items,
        facets: { ...primaryResult.facets, groups: [...primaryResult.facets.groups, ...extraGroups] },
      };
    },

    async getProductBySlug(slug) {
      const product = await primary.getProductBySlug(slug).catch(() => null);
      return product ? enrichProduct(product) : fallback.getProductBySlug(slug);
    },

    async getProductBySku(sku) {
      const product = await primary.getProductBySku(sku).catch(() => null);
      return product ? enrichProduct(product) : fallback.getProductBySku(sku);
    },

    async getVariantOptions(sku) {
      const options = await primary.getVariantOptions(sku).catch(() => []);
      return options.length > 0 ? options : fallback.getVariantOptions(sku);
    },

    async getRelatedProducts(product, limit) {
      const items = await primary.getRelatedProducts(product, limit).catch(() => []);
      return items.length > 0 ? enrichProducts(items) : fallback.getRelatedProducts(product, limit);
    },

    async getCmsContentById(id) {
      try {
        return (await primary.getCmsContentById(id)) ?? fallback.getCmsContentById(id);
      } catch {
        return fallback.getCmsContentById(id);
      }
    },

    async getRecommendations(product, options) {
      try {
        return await primary.getRecommendations(product, options);
      } catch {
        return fallback.getRecommendations(product, options);
      }
    },

    async getCmsPageBySlug(slug) {
      try {
        return (await primary.getCmsPageBySlug(slug)) ?? fallback.getCmsPageBySlug(slug);
      } catch {
        return fallback.getCmsPageBySlug(slug);
      }
    },

    async getSlides() {
      const slides = await primary.getSlides().catch(() => []);
      return slides.length > 0 ? slides : fallback.getSlides();
    },

    async findUser(email, password) {
      try {
        return await primary.findUser(email, password);
      } catch {
        return fallback.findUser(email, password);
      }
    },

    async getUserByEmail(email) {
      try {
        return await primary.getUserByEmail(email);
      } catch {
        return fallback.getUserByEmail(email);
      }
    },
  };
}
