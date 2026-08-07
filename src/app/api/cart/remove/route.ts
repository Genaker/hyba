import { NextResponse } from 'next/server';
import { setCartQuantity } from '@/lib/cart';
import { buildCustomerSections } from '@/lib/hyva/section-data';

export const dynamic = 'force-dynamic';

/** JSON counterpart of the cart page's remove form — a quantity-0 update, kept as its own
 *  endpoint (rather than requiring callers to know that convention) for the cart drawer's
 *  explicit remove button. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const sku = typeof body?.sku === 'string' ? body.sku : '';
  if (!sku) return NextResponse.json({ error: 'sku is required' }, { status: 400 });

  await setCartQuantity(sku, 0);
  return NextResponse.json(await buildCustomerSections(), { headers: { 'cache-control': 'no-store' } });
}
