import { cache } from 'react';
import { provider } from '@/lib/provider';
import { resolveRouteWith } from './route-resolution';

export type { RouteResolution } from './route-resolution';

// Request-scoped memoization: generateMetadata and the page component both
// resolve the same `path` — cache() ensures the three-way lookup runs once
// per request instead of twice. The resolution logic itself lives in
// route-resolution.ts (provider-agnostic, unit-tested).
export const resolveRoute = cache((path: string[]) => resolveRouteWith(provider, path));
