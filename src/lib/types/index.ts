// Simple, denormalized entities — native types, extras welcome.
// Each type lives in its own file (or grouped with closely related types);
// this barrel re-exports everything so existing `@/lib/types` / `./types` /
// `../types` imports keep working unchanged.

export type { PriceTier } from './price';
export type { Product, ProductVariant } from './product';
export type { Category } from './category';
export type { CmsPage } from './cms-page';
export type { CmsContent } from './cms-content';
export type { User } from './user';
export type { Slide } from './slide';
export type { CartItem, CartLine } from './cart';
export type { WishlistItem, WishlistLine } from './wishlist';
export type { CompareItem, CompareLine } from './compare';
export type { Address, Order } from './order';
export type { MenuItem } from './menu';
export type { ProductQuery, Facets, ProductListResult } from './catalog';
