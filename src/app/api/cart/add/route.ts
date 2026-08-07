import { NextResponse } from 'next/server';
import { addToCart } from '@/lib/cart';
import { buildCustomerSections } from '@/lib/hyva/section-data';

export const dynamic = 'force-dynamic';

/** JSON counterpart of addToCartAction (src/lib/actions.ts) — same mutation, called by Alpine's
 *  `@submit.prevent` intercept on add-to-cart forms so the cart drawer can open with the fresh
 *  line and no page reload. The form's own `action={addToCartAction}` stays as the no-JS
 *  fallback (this fork never hydrates React, but works with JS disabled too). */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const sku = typeof body?.sku === 'string' ? body.sku : '';
  const quantity = Math.max(1, Number(body?.quantity ?? 1) || 1);
  if (!sku) return NextResponse.json({ error: 'sku is required' }, { status: 400 });

  await addToCart(sku, quantity);
  return NextResponse.json(await buildCustomerSections(), { headers: { 'cache-control': 'no-store' } });
}
