import { NextResponse } from 'next/server';
import { provider } from '@/lib/provider';
import { storefrontConfig } from '@/lib/config';
import { productUrl } from '@/lib/urls';

export const dynamic = 'force-dynamic';

const RESULT_LIMIT = 8;

type SkuSearchResult = { sku: string; name: string; price: number | null; url: string; image: string | null; matchType?: 'text' | 'semantic' };

// The gateway serves the storefront's dataset dirs by these names (see
// gateway/custom/handlers/data-provider.ts).
const providerToDataset: Record<string, string> = {
  'raw-oro-data': 'oro',
  oro: 'oro',
  'raw-magento-data': 'magento',
  'raw-salesforce-data': 'salesforce',
};

/**
 * SKU/name typeahead for the header quick search (SearchAutocomplete.tsx) and
 * the Quick Order form (public/js/quick-order-search.js).
 *
 * By design the search logic lives at the GATEWAY level (gateway/ — the API
 * layer between frontends and backends), not in Next.js: when GATEWAY_URL is
 * set, this route is a same-origin proxy to the gateway's /api/sku-search
 * (which matches parent SKUs, product names, and configurable-variant SKUs
 * against the dataset). The in-process fallback below keeps quick search
 * working when no gateway is deployed — same contract, and the place to
 * delete once the gateway is mandatory.
 */
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q')?.trim().toLowerCase() ?? '';
  if (query.length < 2) return NextResponse.json([]);

  const gatewayBaseUrl = process.env.GATEWAY_URL;
  if (gatewayBaseUrl) {
    try {
      const dataset = providerToDataset[storefrontConfig.dataProvider.provider] ?? 'magento';
      // forward the real client so the gateway's rate limiter buckets per
      // visitor, not per co-located site (all three arrive from loopback)
      const clientAddress = request.headers.get('x-forwarded-for') ?? '';
      const gatewayResponse = await fetch(
        `${gatewayBaseUrl}/api/sku-search?q=${encodeURIComponent(query)}&dataset=${dataset}`,
        { cache: 'no-store', headers: clientAddress ? { 'x-forwarded-for': clientAddress } : undefined },
      );
      if (gatewayResponse.ok) {
        // unwrap the gateway's {data, meta} envelope back to the bare array the islands expect
        const envelope: { data: SkuSearchResult[] } = await gatewayResponse.json();
        return NextResponse.json(envelope.data);
      }
    } catch {
      // gateway down — fall through to the in-process fallback
    }
  }

  const { items } = await provider.getProducts({ pageSize: 1000 });
  const results: SkuSearchResult[] = [];

  for (const product of items) {
    if (results.length >= RESULT_LIMIT) break;
    const unitPrice = product.prices[0]?.amount ?? null;
    if (product.sku.toLowerCase().includes(query) || product.title.toLowerCase().includes(query)) {
      results.push({ sku: product.sku, name: product.title, price: unitPrice, url: productUrl(product), image: product.image, matchType: 'text' });
      continue; // parent matched — variant SKUs of the same product would just be noise
    }
    for (const variant of product.variants) {
      if (results.length >= RESULT_LIMIT) break;
      if (variant.sku.toLowerCase().includes(query)) {
        results.push({ sku: variant.sku, name: product.title, price: variant.price ?? unitPrice, url: productUrl(product), image: variant.image ?? product.image, matchType: 'text' });
      }
    }
  }

  return NextResponse.json(results);
}
