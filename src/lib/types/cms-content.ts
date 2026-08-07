/**
 * A CMS content block — embeddable, merchandiser-editable HTML addressed by a
 * string id, NOT routable (that's CmsPage's job, which has a slug and its own
 * URL). Mirrors Oro's Content Block / Magento's CMS Block concept: pages place
 * a block by id ("home" is the homepage's block), and editing the block never
 * touches page structure.
 *
 * @example
 * { "id": "home", "content": "<section class=\"hero-slider\">...</section>" }
 */
export interface CmsContent {
  id: string;
  content: string;                  // HTML
}
