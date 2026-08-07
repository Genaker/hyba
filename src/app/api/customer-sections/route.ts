import { NextResponse } from 'next/server';
import { buildCustomerSections } from '@/lib/hyva/section-data';

export const dynamic = 'force-dynamic';

/** Fetched by public/js/hyva/bootstrap.mjs on load and after every cart/wishlist/compare
 *  mutation — see buildCustomerSections() for the payload shape and event contract. */
export async function GET() {
  return NextResponse.json(await buildCustomerSections(), { headers: { 'cache-control': 'no-store' } });
}
