import { NextResponse } from 'next/server';
import { provider } from '@/lib/provider';
import type { Product } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * Same-origin proxy for the lazily-loaded recommendation rails
 * (ProductRecommendations.tsx fetches this from the browser on scroll-into-view;
 * the gateway stays loopback-only). Resolution happens in the gateway —
 * this passes through the provider like every other data access.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const id = Number(params.get('id') ?? 0);
  const categoryPath = params.get('categoryPath') ?? '';
  const flavor = params.get('flavor') ?? 'similar';
  const mode = params.get('mode') ?? 'auto';
  if (!id || !['similar', 'accessories', 'also-like'].includes(flavor) || !['ai', 'standard', 'auto'].includes(mode)) {
    return NextResponse.json({ mode: 'standard', items: [] }, { status: 400 });
  }
  // the gateway only needs id + categoryPath from the product — a stub is the
  // honest minimal input here, not a data-model violation
  const result = await provider.getRecommendations({ id, categoryPath } as Product, {
    flavor: flavor as 'similar' | 'accessories' | 'also-like',
    mode: mode as 'ai' | 'standard' | 'auto',
    limit: Math.min(20, Math.max(1, Number(params.get('limit') ?? 5) || 5)),
  });
  return NextResponse.json(result);
}
