import 'server-only';
import { cookies } from 'next/headers';
import { provider } from './provider';
import type { CompareItem, CompareLine } from './types';

const compareCookieName = 'compare';

// A comparison table wider than this stops being readable — same reasoning most real
// storefronts cap this at 4: a fixed, generous-enough bound rather than unbounded growth.
export const MAX_COMPARE_ITEMS = 4;

export async function readCompare(): Promise<CompareItem[]> {
  const cookieValue = (await cookies()).get(compareCookieName)?.value;
  if (!cookieValue) return [];
  try {
    const parsed = JSON.parse(cookieValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeCompare(items: CompareItem[]): Promise<void> {
  (await cookies()).set(compareCookieName, JSON.stringify(items), {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function isInCompare(sku: string): Promise<boolean> {
  const items = await readCompare();
  return items.some((item) => item.sku === sku);
}

/**
 * Toggles membership — the PDP/header control is a single button, not separate add/remove
 * forms. Adding past MAX_COMPARE_ITEMS is a silent no-op (the button itself renders disabled
 * once the cap is reached, see CompareButton.tsx — this is the same guard enforced again
 * server-side, since forms can be resubmitted regardless of the disabled attribute).
 */
export async function toggleCompare(sku: string): Promise<void> {
  const items = await readCompare();
  if (items.some((item) => item.sku === sku)) {
    await writeCompare(items.filter((item) => item.sku !== sku));
    return;
  }
  if (items.length >= MAX_COMPARE_ITEMS) return;
  await writeCompare([...items, { sku }]);
}

export async function removeFromCompare(sku: string): Promise<void> {
  const items = await readCompare();
  await writeCompare(items.filter((item) => item.sku !== sku));
}

export async function getCompareLines(): Promise<CompareLine[]> {
  const items = await readCompare();
  const lines: CompareLine[] = [];
  for (const item of items) {
    const product = await provider.getProductBySku(item.sku);
    if (product) lines.push({ product });
  }
  return lines;
}
