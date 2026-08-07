import type { DataProvider } from './index';
import { createGatewayProvider } from './gateway-provider';

/** Shopify Hydrogen demo dataset (hydrogen.shop) — fully resolved by the gateway (catalog engine, facets, menu, auth). */
export const rawShopifyDataProvider: DataProvider = createGatewayProvider('shopify');
