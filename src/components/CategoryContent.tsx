import { provider } from '@/lib/provider';
import { categoryCrumbs } from '@/lib/breadcrumbs';
import Container from '@/theme/Container';
import PageHeader from '@/theme/PageHeader';
import ProductListing, { parseListParams } from './ProductListing';
import type { Category } from '@/lib/types';
import { categoryUrl } from '@/lib/urls';

export default async function CategoryContent({
  category,
  rawParams,
}: {
  category: Category;
  rawParams: Record<string, string | string[] | undefined>;
}) {
  const query = { ...parseListParams(rawParams), categoryPath: category.path };
  const [result, crumbs] = await Promise.all([provider.getProducts(query), categoryCrumbs(category)]);

  return (
    <Container size="7xl" className="category-view pb-10">
      <PageHeader crumbs={crumbs} title={category.title} />
      <ProductListing result={result} basePath={categoryUrl(category)} rawParams={rawParams} />
    </Container>
  );
}
