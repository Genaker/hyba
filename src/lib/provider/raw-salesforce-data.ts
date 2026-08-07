import type { DataProvider } from './index';
import { createGatewayProvider } from './gateway-provider';

/** Salesforce "Alpine Group" dataset — fully resolved by the gateway (catalog engine, facets, menu, auth). */
export const rawSalesforceDataProvider: DataProvider = createGatewayProvider('salesforce');
