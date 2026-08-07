import { NextResponse } from 'next/server';
import { toggleCompare, isInCompare, MAX_COMPARE_ITEMS } from '@/lib/compare';
import { buildCustomerSections } from '@/lib/hyva/section-data';

export const dynamic = 'force-dynamic';

/** JSON counterpart of toggleCompareAction — see wishlist/toggle's route for the pattern. Silent
 *  no-op past MAX_COMPARE_ITEMS, same as the server action; `inCompare` tells the caller whether
 *  the toggle actually took effect (false→false when the list was already full). */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const sku = typeof body?.sku === 'string' ? body.sku : '';
  if (!sku) return NextResponse.json({ error: 'sku is required' }, { status: 400 });

  await toggleCompare(sku);
  const sections = await buildCustomerSections();
  return NextResponse.json(
    { ...sections, inCompare: await isInCompare(sku), maxItems: MAX_COMPARE_ITEMS },
    { headers: { 'cache-control': 'no-store' } },
  );
}
