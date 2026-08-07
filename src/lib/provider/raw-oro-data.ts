import type { DataProvider } from './index';
import { createGatewayProvider } from './gateway-provider';

/** OroCommerce demo dataset — fully resolved by the gateway (catalog engine, facets, menu, auth). */
export const rawOroDataProvider: DataProvider = createGatewayProvider('oro');
