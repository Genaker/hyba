import 'server-only';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Order } from './types';

// Simple JSON file store — enough for the demo; swap for the oro provider later.
const storeDir = join(process.cwd(), '.store');
const storeFile = join(storeDir, 'orders.json');

function readAll(): Order[] {
  try {
    return JSON.parse(readFileSync(storeFile, 'utf8'));
  } catch {
    return [];
  }
}

export function saveOrder(order: Order): void {
  mkdirSync(storeDir, { recursive: true });
  writeFileSync(storeFile, JSON.stringify([...readAll(), order], null, 2));
}

export function getOrdersByEmail(email: string): Order[] {
  return readAll()
    .filter((order) => order.email.toLowerCase() === email.toLowerCase())
    .reverse();
}

export function getOrderById(id: string): Order | null {
  return readAll().find((order) => order.id === id) ?? null;
}

export function nextOrderId(): string {
  return `ORD-${new Date().getFullYear()}-${String(readAll().length + 1).padStart(4, '0')}`;
}
