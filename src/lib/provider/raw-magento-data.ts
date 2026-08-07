import type { DataProvider } from './index';
import { createGatewayProvider } from './gateway-provider';

/** Magento Luma sample dataset — fully resolved by the gateway (catalog engine, facets, menu, auth). */
export const rawMagentoDataProvider: DataProvider = createGatewayProvider('magento');
