import type { DataProvider } from './index';
import { createGatewayProvider } from './gateway-provider';

/** Shopware 6 demo dataset (self-hosted via shopware/docker-compose.yml, Store API extraction) — fully resolved by the gateway (catalog engine, facets, menu, auth). */
export const rawShopwareDataProvider: DataProvider = createGatewayProvider('shopware');
