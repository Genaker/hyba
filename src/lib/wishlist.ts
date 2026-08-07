import 'server-only';
import { cookies } from 'next/headers';
import { provider } from './provider';
import type { WishlistItem, WishlistLine } from './types';

const wishlistCookieName = 'wishlist';

export async function readWishlist(): Promise<WishlistItem[]> {
  const cookieValue = (await cookies()).get(wishlistCookieName)?.value;
  if (!cookieValue) return [];
  try {
    const parsed = JSON.parse(cookieValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeWishlist(items: WishlistItem[]): Promise<void> {
  (await cookies()).set(wishlistCookieName, JSON.stringify(items), {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function isInWishlist(sku: string): Promise<boolean> {
  const items = await readWishlist();
  return items.some((item) => item.sku === sku);
}

/** Toggles membership — the PDP/header control is a single button, not separate add/remove forms. */
export async function toggleWishlist(sku: string): Promise<void> {
  const items = await readWishlist();
  const next = items.some((item) => item.sku === sku)
    ? items.filter((item) => item.sku !== sku)
    : [...items, { sku }];
  await writeWishlist(next);
}

export async function removeFromWishlist(sku: string): Promise<void> {
  const items = await readWishlist();
  await writeWishlist(items.filter((item) => item.sku !== sku));
}

export async function getWishlistLines(): Promise<WishlistLine[]> {
  const items = await readWishlist();
  const lines: WishlistLine[] = [];
  for (const item of items) {
    const product = await provider.getProductBySku(item.sku);
    if (product) lines.push({ product });
  }
  return lines;
}
