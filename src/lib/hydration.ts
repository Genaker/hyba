import 'server-only';
import { storefrontConfig } from './config';

/**
 * Which routes keep React hydration scripts — driven by config.yaml
 * (javascript.mode / hydratePaths), same source server.mjs reads.
 * Vanilla-JS islands render only on zero-JS routes.
 */
export function isHydratedPath(pathname: string): boolean {
  return storefrontConfig.isHydratedPath(pathname);
}
