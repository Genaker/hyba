import { NextResponse } from 'next/server';
import { storefrontConfig } from '@/lib/config';

// Always reflect the runtime-loaded config.yaml/env (not a build-time snapshot) — see
// config.ts's own "read once at server startup" comment; this route just exposes that.
export const dynamic = 'force-dynamic';

/**
 * Public storefront configuration — branding a frontend/CMS/monitoring tool can fetch
 * without rendering a page: site name, page title, meta description, logo. Sourced from
 * config.yaml's `site` block (see that file), the same data src/app/layout.tsx and
 * Header.tsx/Footer.tsx already render from.
 *
 * This is an unauthenticated, public route — expose only non-sensitive display config here.
 * Never spread the full `storefrontConfig` object into the response: `dataProvider` alone
 * (not `storefrontConfig.dataProvider`) is deliberate, since that config block also carries
 * `fallbackToRaw`, and other top-level blocks (env-derived Oro API credentials, etc.) must
 * never reach this endpoint.
 */
export async function GET() {
  const { site, dataProvider } = storefrontConfig;
  return NextResponse.json({
    ...site,
    dataProvider: dataProvider.provider,
  });
}
