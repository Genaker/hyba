import { NextResponse } from 'next/server';
import { setCartQuantity } from '@/lib/cart';
import { buildCustomerSections } from '@/lib/hyva/section-data';

export const dynamic = 'force-dynamic';

/** JSON counterpart of updateCartAction — sets an absolute quantity (0 removes the line). Used
 *  by the cart drawer's qty stepper and the /cart page's Alpine-enhanced quantity fields. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const sku = typeof body?.sku === 'string' ? body.sku : '';
  const quantity = Math.max(0, Number(body?.quantity ?? 0) || 0);
  if (!sku) return NextResponse.json({ error: 'sku is required' }, { status: 400 });

  await setCartQuantity(sku, quantity);
  return NextResponse.json(await buildCustomerSections(), { headers: { 'cache-control': 'no-store' } });
}
