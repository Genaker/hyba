import 'server-only';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CartItem } from './types';

export interface ShoppingList {
  id: string;
  name: string;
  email: string;
  items: CartItem[];
}

// Same simple JSON file store pattern as orders.ts.
const storeDir = join(process.cwd(), '.store');
const storeFile = join(storeDir, 'shopping-lists.json');

function readAll(): ShoppingList[] {
  try {
    return JSON.parse(readFileSync(storeFile, 'utf8'));
  } catch {
    return [];
  }
}

function writeAll(lists: ShoppingList[]): void {
  mkdirSync(storeDir, { recursive: true });
  writeFileSync(storeFile, JSON.stringify(lists, null, 2));
}

export function getShoppingLists(email: string): ShoppingList[] {
  return readAll().filter((list) => list.email.toLowerCase() === email.toLowerCase());
}

export function getShoppingList(email: string, listId: string): ShoppingList | null {
  return getShoppingLists(email).find((list) => list.id === listId) ?? null;
}

export function createShoppingList(email: string, name: string): ShoppingList {
  const lists = readAll();
  const newList: ShoppingList = {
    id: `sl-${lists.length + 1}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    name,
    email,
    items: [],
  };
  writeAll([...lists, newList]);
  return newList;
}

/** Adds to the named list, creating the user's default list on first use. */
export function addItemToList(email: string, listId: string | null, sku: string, quantity: number): ShoppingList {
  const lists = readAll();
  let target = lists.find(
    (list) => list.email.toLowerCase() === email.toLowerCase() && (listId ? list.id === listId : true),
  );
  if (!target) {
    target = createShoppingList(email, 'Shopping List');
    return addItemToList(email, target.id, sku, quantity);
  }
  const existing = target.items.find((item) => item.sku === sku);
  if (existing) existing.quantity += quantity;
  else target.items.push({ sku, quantity });
  writeAll(lists);
  return target;
}

export function removeItemFromList(email: string, listId: string, sku: string): void {
  const lists = readAll();
  const target = lists.find((list) => list.email.toLowerCase() === email.toLowerCase() && list.id === listId);
  if (!target) return;
  target.items = target.items.filter((item) => item.sku !== sku);
  writeAll(lists);
}

export function deleteShoppingList(email: string, listId: string): void {
  writeAll(readAll().filter((list) => !(list.email.toLowerCase() === email.toLowerCase() && list.id === listId)));
}
