import type { CmsContent } from '@/lib/types';

/**
 * Renders an embeddable CMS content block (CmsContent — id-addressed, not
 * routable). Sibling of CmsContent.tsx, which renders a full routable CmsPage
 * with page chrome: a block is placed *inside* a page the code owns; it never
 * defines page structure. `rich-text` supplies the fallback typography for
 * blocks with no Tailwind classes of their own (see cms-tailwind-classes.ts).
 */
export default function CmsContentBlock({ block, className = '' }: { block: CmsContent; className?: string }) {
  return (
    <section
      className={`cms-content-block rich-text ${className}`.trim()}
      data-cms-content={block.id}
      dangerouslySetInnerHTML={{ __html: block.content }}
    />
  );
}
