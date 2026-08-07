import { NextResponse } from 'next/server';
import { toggleWishlist, isInWishlist } from '@/lib/wishlist';
import { buildCustomerSections } from '@/lib/hyva/section-data';

export const dynamic = 'force-dynamic';

/** JSON counterpart of toggleWishlistAction — used by Alpine's `@submit.prevent` intercept on
 *  wishlist heart buttons so the header count updates without a page reload. The form's own
 *  `action={toggleWishlistAction}` stays as the no-JS fallback. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const sku = typeof body?.sku === 'string' ? body.sku : '';
  if (!sku) return NextResponse.json({ error: 'sku is required' }, { status: 400 });

  await toggleWishlist(sku);
  const sections = await buildCustomerSections();
  return NextResponse.json({ ...sections, inWishlist: await isInWishlist(sku) }, { headers: { 'cache-control': 'no-store' } });
}
