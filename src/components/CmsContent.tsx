import Container from '@/theme/Container';
import PageHeader from '@/theme/PageHeader';
import type { CmsPage } from '@/lib/types';

export default function CmsContent({ cmsPage }: { cmsPage: CmsPage }) {
  // Demo WYSIWYG content starts at h3 — lift heading levels for correct outline.
  const content = cmsPage.content
    .replaceAll('<h3', '<h2').replaceAll('</h3>', '</h2>')
    .replaceAll('<h4', '<h3').replaceAll('</h4>', '</h3>');

  return (
    <Container size="3xl" className="cms-page pb-10">
      <PageHeader crumbs={[{ label: cmsPage.title }]} title={cmsPage.title} />
      <div className="cms-content rich-text" dangerouslySetInnerHTML={{ __html: content }} />
    </Container>
  );
}
