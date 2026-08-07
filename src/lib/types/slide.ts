/**
 * One home-page hero slide. `image` is the wide/desktop asset; `imageMedium`
 * is an optional smaller variant for the mobile `srcset` (`null` when the
 * source slide never had one).
 *
 * @example
 * {
 *   "order": 1,
 *   "url": "/product/",
 *   "header": "Seasonal Sale",
 *   "text": "Get 25 Percent Off the Order Total With a Coupon Code SALE25...",
 *   "alt": "Seasonal Sale",
 *   "textAlignment": "left",
 *   "image": "/media/slider/slide-1-wide.webp",
 *   "imageMedium": null
 * }
 */
export interface Slide {
  order: number;
  url: string;
  header: string;
  text: string;
  alt: string;
  textAlignment: string;
  image: string | null;
  imageMedium: string | null;
}
