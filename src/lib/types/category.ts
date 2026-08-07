/**
 * Catalog category. `path` is the URL-safe ancestor chain used for routing
 * (`/${path}`); the root category has `path: ""` and is never linked to
 * directly. `parentId` walks the tree upward, `level` is 1 for top-level nav.
 *
 * @example
 * { "id": 6, "parentId": 5, "level": 2, "title": "Medical Apparel", "slug": "medical-apparel", "path": "medical/medical-apparel" }
 */
export interface Category {
  id: number;
  parentId: number | null;
  level: number;
  title: string;
  slug: string;
  path: string;                     // "" for root
}
