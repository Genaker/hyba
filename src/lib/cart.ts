import 'server-only';
import { cookies } from 'next/headers';
import { provider } from './provider';
import { tierPrice } from './format';
import type { CartItem, CartLine } from './types';

const cartCookieName = 'cart';

export async function readCart(): Promise<CartItem[]> {
  const cookieValue = (await cookies()).get(cartCookieName)?.value;
  if (!cookieValue) return [];
  try {
    const parsed = JSON.parse(cookieValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function writeCart(items: CartItem[]): Promise<void> {
  (await cookies()).set(cartCookieName, JSON.stringify(items), {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function addToCart(sku: string, quantity: number): Promise<void> {
  const items = await readCart();
  const existing = items.find((item) => item.sku === sku);
  if (existing) existing.quantity += quantity;
  else items.push({ sku, quantity });
  await writeCart(items);
}

export async function setCartQuantity(sku: string, quantity: number): Promise<void> {
  const items = await readCart();
  const next = quantity > 0
    ? items.map((item) => (item.sku === sku ? { ...item, quantity } : item))
    : items.filter((item) => item.sku !== sku);
  await writeCart(next);
}

export async function clearCart(): Promise<void> {
  (await cookies()).delete(cartCookieName);
}

export async function getCartLines(): Promise<CartLine[]> {
  const items = await readCart();
  const lines: CartLine[] = [];
  for (const item of items) {
    const product = await provider.getProductBySku(item.sku);
    if (!product) continue;
    const unitPrice = tierPrice(product.prices, item.quantity);
    const selectedOptions = await provider.getVariantOptions(item.sku);
    lines.push({ product, quantity: item.quantity, unitPrice, totalPrice: unitPrice * item.quantity, selectedOptions });
  }
  return lines;
}

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.totalPrice, 0);
}
