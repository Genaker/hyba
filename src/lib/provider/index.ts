import type { Category, CmsContent, CmsPage, MenuItem, Product, ProductListResult, ProductQuery, Slide, User } from '../types';
import { storefrontConfig } from '../config';
import { rawOroDataProvider } from './raw-oro-data';
import { rawMagentoDataProvider } from './raw-magento-data';
import { rawSalesforceDataProvider } from './raw-salesforce-data';
import { rawShopifyDataProvider } from './raw-shopify-data';
import { rawShopwareDataProvider } from './raw-shopware-data';
import { rawBigcommerceDataProvider } from './raw-bigcommerce-data';
import { oroApiProvider, isOroApiConfigured } from './oro';
import { withFallback } from './with-fallback';

/**
 * Data provider contract. Four static providers serve extracted/hand-authored
 * JSON demo datasets (`raw-oro-data` — extracted from a real OroCommerce
 * instance; `raw-magento-data` — a Magento Luma-style demo catalog;
 * `raw-salesforce-data` — Salesforce B2B Commerce's public Alpine Group demo
 * store; `raw-shopify-data` — Shopify's public Hydrogen demo store,
 * hydrogen.shop; `raw-shopware-data` — a self-hosted Shopware 6 instance
 * (shopware/docker-compose.yml) with generated demo data, extracted via its
 * Store API; `raw-bigcommerce-data` — BigCommerce's public APAC demo store,
 * apacdemostore.mybigcommerce.com, extracted via real page scraping (no
 * public storefront API on that store)); the live `oro` provider implements
 * the same interface against Oro's real storefront REST API. Any of the
 * seven can serve every page without page code changes — see config.yaml's
 * `dataProvider` block.
 */
export interface DataProvider {
  getCategories(): Promise<Category[]>;
  getCategoryByPath(path: string): Promise<Category | null>;
  getMenu(): Promise<MenuItem[]>;
  getProducts(query: ProductQuery): Promise<ProductListResult>;
  getProductBySlug(slug: string): Promise<Product | null>;
  getProductBySku(sku: string): Promise<Product | null>;
  // The selected variant's own attribute values (e.g. [{label:'Size',value:'M'}]) when `sku`
  // is a configurable-product variant, for display on the cart/order line — [] otherwise
  // (a simple product, or a platform with no configurable-product concept, e.g. live Oro).
  getVariantOptions(sku: string): Promise<{ label: string; value: string }[]>;
  getRelatedProducts(product: Product, limit: number): Promise<Product[]>;
  // AI/standard product recommendations. `mode` selects the engine: 'ai'/'auto' use
  // embedding KNN on the gateway (falling back to standard category-based when vectors
  // are unavailable), 'standard' forces the classic behavior. The response reports
  // which engine actually served, so UIs can mark AI rails (✦ AI, see THEMING.md).
  getRecommendations(
    product: Product,
    options: { flavor: 'similar' | 'accessories' | 'also-like'; mode?: 'ai' | 'standard' | 'auto'; limit?: number },
  ): Promise<{ mode: 'semantic' | 'standard'; items: Product[] }>;
  getCmsPageBySlug(slug: string): Promise<CmsPage | null>;
  // Embeddable CMS content block by string id (CmsContent's doc comment) — "home" is the
  // homepage's block, the freeform merchandiser-editable content real Oro/Magento model as
  // a content/CMS block. Pages place blocks; blocks never define page structure.
  getCmsContentById(id: string): Promise<CmsContent | null>;
  getSlides(): Promise<Slide[]>;
  findUser(email: string, password: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
}

// dataProvider.provider ("raw-oro-data"|"raw-magento-data"|"oro", config.yaml or DATA_PROVIDER env
// — see README "Going live against Oro") picks which provider serves every page.
// "oro" (the live adapter) gets wrapped with withFallback() against raw-oro-data specifically (not
// whichever raw provider happens to be configured — Oro's live catalog and Magento's demo catalog
// don't share SKUs/categories, so raw-oro-data is the only sensible fallback source for it) when
// dataProvider.fallbackToRaw is true (default), for what Oro's frontend API can't supply at all or
// can't supply accurately on listing pages. Falls back to raw-oro-data outright if "oro" is
// selected but not actually configured (missing ORO_API_BASE_URL/CLIENT_ID/CLIENT_SECRET), rather
// than failing every request.
function resolveProvider(): DataProvider {
  if (storefrontConfig.dataProvider.provider === 'raw-magento-data') return rawMagentoDataProvider;
  if (storefrontConfig.dataProvider.provider === 'raw-salesforce-data') return rawSalesforceDataProvider;
  if (storefrontConfig.dataProvider.provider === 'raw-shopify-data') return rawShopifyDataProvider;
  if (storefrontConfig.dataProvider.provider === 'raw-shopware-data') return rawShopwareDataProvider;
  if (storefrontConfig.dataProvider.provider === 'raw-bigcommerce-data') return rawBigcommerceDataProvider;
  if (storefrontConfig.dataProvider.provider !== 'oro' || !isOroApiConfigured()) return rawOroDataProvider;
  return storefrontConfig.dataProvider.fallbackToRaw ? withFallback(oroApiProvider, rawOroDataProvider) : oroApiProvider;
}

export const provider: DataProvider = resolveProvider();
