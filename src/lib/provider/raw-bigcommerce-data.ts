import type { DataProvider } from './index';
import { createGatewayProvider } from './gateway-provider';

/** BigCommerce's public APAC demo store (apacdemostore.mybigcommerce.com) dataset — fully resolved by the gateway (catalog engine, facets, menu, auth). */
export const rawBigcommerceDataProvider: DataProvider = createGatewayProvider('bigcommerce');
