/**
 * One header nav entry, from `provider.getMenu()`. Nesting depth is used
 * structurally by `MegaMenu`: level 1 = top-level nav items, level 2 =
 * mega-panel columns, level 3 = links within a column.
 *
 * @example
 * {
 *   "title": "Medical",
 *   "url": "/medical",
 *   "icon": "cross",
 *   "image": "/media/products/medium/2JV62.webp",
 *   "children": [
 *     {
 *       "title": "Medical Apparel",
 *       "url": "/medical/medical-apparel",
 *       "icon": null,
 *       "image": null,
 *       "children": [
 *         { "title": "Medical Uniforms", "url": "/medical/medical-apparel/medical-uniforms", "icon": null, "image": null, "children": [] }
 *       ]
 *     }
 *   ]
 * }
 */
export interface MenuItem {
  title: string;
  url: string;
  icon: string | null;              // icon name, mapped to an inline SVG by the header
  image: string | null;             // optional promo image URL for mega-menu columns
  children: MenuItem[];
}
