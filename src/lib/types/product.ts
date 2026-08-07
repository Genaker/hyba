import type { PriceTier } from './price';

/**
 * One buyable variant of a configurable product (e.g. a specific
 * color/size combination), each its own SKU with its own image/price/stock.
 * `options` names the axes that distinguish it from sibling variants.
 *
 * @see https://ucp.dev/2026-04-08/specification/catalog/ — UCP Catalog capability (Variant.options is this type's closest analog)
 *
 * @example
 * {
 *   "sku": "WSH12-28-Green",
 *   "options": [
 *     { "code": "color", "label": "Color", "value": "Green", "swatchType": "color", "swatch": "#53a828" },
 *     { "code": "size", "label": "Size", "value": "28", "swatchType": "text" }
 *   ],
 *   "image": "/media/magento/products/variants/wsh12-28-green.jpg",
 *   "price": 45,
 *   "inStock": true
 * }
 */
export interface ProductVariant {
  sku: string;
  // swatchType picks how this axis renders: 'color' → a color swatch (`swatch` is a CSS
  // color), 'image' → a thumbnail swatch (`swatch` is an image path), 'text' → a plain
  // text button using `value` (e.g. Size) — `swatch` is absent for 'text'.
  options: { code: string; label: string; value: string; swatchType: 'color' | 'image' | 'text'; swatch?: string }[];
  image: string | null;
  // This variant's own shots (a colour's main/alt/back views). [] when the
  // backend has no per-variant gallery; the product page then falls back to the
  // parent gallery, so selecting a colour still shows something sensible.
  gallery: string[];
  price: number | null;
  inStock: boolean;
}

/**
 * Catalog product. `attributes` is raw JSON straight from the data provider —
 * shape not enforced by the type system, so this example IS the contract:
 * a list of attribute groups (`family` names a group; `family: null` means
 * ungrouped/freeform), each holding `{label, value}` pairs where
 * `value: null` marks a freeform bullet with no distinct value (label alone
 * is shown). Rendered as the product page's "Specifications" accordion.
 *
 * @see https://ucp.dev/2026-04-08/specification/catalog/ — UCP Catalog capability (Product.title naming follows it; `attributes` is our `metadata`-style escape hatch)
 *
 * @example
 * {
 *   "id": 1,
 *   "sku": "0RT28",
 *   "title": "220 Lumen Rechargeable Headlamp",
 *   "slug": "220-lumen-rechargeable-headlamp",
 *   "shortDescription": "This rechargeable headlamp can also be used with standard AAA batteries...",
 *   "description": "<p class=\"product-view-desc\">This rechargeable headlamp can also be used...</p>",
 *   "attributes": [
 *     {
 *       "family": "Product Information & Features",
 *       "attributes": [
 *         { "label": "Catalog Page", "value": "9927" },
 *         { "label": "220 lumen power", "value": null },
 *         { "label": "Light modes", "value": "low power, mid power, high power, dim, blink, SOS" },
 *         { "label": "Flexible mount", "value": null }
 *       ]
 *     },
 *     {
 *       "family": "Technical Specs",
 *       "attributes": [
 *         { "label": "Width", "value": "3”" },
 *         { "label": "Weight", "value": ".8 lb." }
 *       ]
 *     }
 *   ],
 *   "brandId": 1,
 *   "brand": "ACME",
 *   "categoryId": 4,
 *   "categoryPath": "lighting-products/headlamps",
 *   "isFeatured": true,
 *   "isNewArrival": false,
 *   "inStock": false,
 *   "prices": [
 *     { "quantity": 1, "amount": 99.99, "currency": "USD" },
 *     { "quantity": 10, "amount": 94.99, "currency": "USD" },
 *     { "quantity": 20, "amount": 89.99, "currency": "USD" }
 *   ],
 *   "image": "/media/products/medium/0RT28.webp",
 *   "imageLarge": "/media/products/large/0RT28.webp",
 *   "gallery": ["/media/products/large/0RT28.webp", "/media/products/large/0RT28-alt1.webp"],
 *   "variants": []
 * }
 */
export interface Product {
  id: number;
  sku: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;       // intro copy only — attributes live in `attributes`, not here
  attributes: any[];                // raw JSON, shape not enforced — see @example above
  brandId: number | null;
  brand: string | null;
  categoryId: number | null;
  categoryPath: string;             // "medical/medical-apparel"
  isFeatured: boolean;
  isNewArrival: boolean;
  inStock: boolean;
  prices: PriceTier[];              // sorted by quantity; [0] = unit price
  image: string | null;             // 378px tile image
  imageLarge: string | null;        // 610px detail image
  // Full media gallery for the product page (main shot first, then alternates —
  // source order preserved). [] when the backend has no gallery concept or the
  // product has only one shot; the gallery component then falls back to
  // imageLarge/image, so consumers never need to special-case an empty array.
  gallery: string[];
  variants: ProductVariant[];       // configurable-product children; [] for a simple product
}
