/**
 * A CMS content page (About, Shipping & Returns, …) — routable at /<slug>.
 * `content` is raw WYSIWYG HTML rendered directly. For non-routable embeddable
 * blocks (the homepage's block), see CmsContent — id-addressed, no slug.
 *
 * @example
 * { "id": 2, "title": "About", "slug": "about", "content": "<div class=\"grid about-us-page-grid\">...</div>" }
 */
export interface CmsPage {
  id: number;
  title: string;
  slug: string;
  content: string;                  // HTML
}
