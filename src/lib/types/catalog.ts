import type { Category } from './category';
import type { Product } from './product';

/**
 * A category/search listing request, parsed entirely from URL search params
 * by `parseListParams` — nothing here is client state. `attributes` holds
 * the active facet filters, keyed by facet group `key` and sourced from
 * `f_<key>=value1,value2` params (e.g. `f_brand=1,2&f_instock=1`).
 *
 * @example
 * {
 *   "categoryPath": "medical",
 *   "search": undefined,
 *   "attributes": { "brand": ["1"], "instock": ["1"] },
 *   "minPrice": 10,
 *   "maxPrice": 50,
 *   "sort": "price",
 *   "dir": "desc",
 *   "page": 2,
 *   "pageSize": 12
 * }
 */
export interface ProductQuery {
  categoryPath?: string;            // subtree prefix
  search?: string;
  attributes?: Record<string, string[]>;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'name' | 'price' | 'sku' | 'newest';
  dir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

/**
 * The full facet payload for a listing response: dynamic filter groups
 * (raw JSON, shape not enforced — same spirit as `Product.attributes`: the
 * provider's facet registry in `raw.ts` defines what exists, so this stays
 * freeform rather than a type every new facet has to satisfy) plus the two
 * structurally different filters — price (a numeric range) and
 * subcategories (navigation, not a value filter).
 *
 * @example
 * {
 *   "groups": [
 *     { "key": "brand", "label": "Brand", "type": "checkbox", "options": [{ "value": "1", "label": "ACME", "count": 9 }, { "value": "2", "label": "Default ltd.", "count": 6 }] },
 *     { "key": "instock", "label": "Availability", "type": "boolean", "options": [{ "value": "1", "label": "In stock only", "count": 12 }] },
 *     { "key": "color", "label": "Color", "type": "checkbox", "options": [{ "value": "grey", "label": "Grey", "count": 3 }] }
 *   ],
 *   "subcategories": [
 *     { "category": { "id": 6, "parentId": 5, "level": 2, "title": "Medical Apparel", "slug": "medical-apparel", "path": "medical/medical-apparel" }, "count": 14 }
 *   ],
 *   "priceMin": 8,
 *   "priceMax": 245
 * }
 */
export interface Facets {
  groups: any[];                    // raw JSON, shape not enforced — see @example above
  subcategories: { category: Category; count: number }[];
  priceMin: number;
  priceMax: number;
}

/**
 * `provider.getProducts()`'s return shape — one page of products plus the
 * facets computed for the current filter state.
 *
 * @example
 * {
 *   "items": ["<Product>", "..."],
 *   "total": 15,
 *   "page": 1,
 *   "pageSize": 12,
 *   "totalPages": 2,
 *   "facets": "<Facets>"
 * }
 */
export interface ProductListResult {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  facets: Facets;
}
