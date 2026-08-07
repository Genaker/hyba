/**
 * Oro's WYSIWYG product description bakes attribute-style bullet lists straight
 * into the HTML (e.g. "Product Information & Features:" / "Technical Specs:"
 * headings each followed by a <ul>). Pulls those into structured attribute
 * groups and strips them out of the description, leaving just the intro copy.
 *
 * Ported from scripts/extract-oro-data.mjs — the raw provider does this once at
 * extraction time and caches the result in products.json; the live Oro
 * provider gets the same un-processed HTML from the API on every request, so
 * it has to run the same parsing itself.
 */

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

export interface AttributeGroup {
  family: string;
  attributes: { label: string; value: string | null }[];
}

export function extractAttributeGroups(descriptionHtml: string | null): {
  attributeGroups: AttributeGroup[];
  cleanedDescription: string | null;
} {
  if (!descriptionHtml) return { attributeGroups: [], cleanedDescription: descriptionHtml };

  const groupPattern = /<p\s*class="product-view-desc-title">([^<]+?):?<\/p>\s*(?:<br\s*\/?>)?\s*<ul class="product-view-desc-list">([\s\S]*?)<\/ul>/g;
  const itemPattern = /<li class="product-view-desc-list__item">([\s\S]*?)<\/li>/g;
  const attributeGroups: AttributeGroup[] = [];

  const cleanedDescription = descriptionHtml
    .replace(groupPattern, (_match, familyName: string, listHtml: string) => {
      const attributes: { label: string; value: string | null }[] = [];
      for (const [, rawItem] of listHtml.matchAll(itemPattern)) {
        const text = decodeHtmlEntities(rawItem.replace(/<[^>]+>/g, '').trim());
        const colonSplit = text.match(/^([^:]{1,48}):\s*(.+)$/);
        attributes.push(colonSplit ? { label: colonSplit[1].trim(), value: colonSplit[2].trim() } : { label: text, value: null });
      }
      attributeGroups.push({ family: decodeHtmlEntities(familyName.trim()), attributes });
      return '';
    })
    .trim();

  return { attributeGroups, cleanedDescription };
}

/** Fallback slugifier — only needed for the root category, which has no Oro-generated `url`. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
