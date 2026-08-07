import type { Metadata } from 'next';
import { provider } from '@/lib/provider';
import { getDictionary } from '@/lib/i18n';
import Container from '@/theme/Container';
import PageHeader from '@/theme/PageHeader';
import ProductListing, { parseListParams } from '@/components/ProductListing';

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const [rawParams, { search }] = await Promise.all([searchParams, getDictionary()]);
  const term = typeof rawParams.search === 'string' ? rawParams.search : '';
  return { title: term ? search.resultsForTitle(term) : search.label };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const [rawParams, dictionary] = await Promise.all([searchParams, getDictionary()]);
  const { search } = dictionary;
  const term = typeof rawParams.search === 'string' ? rawParams.search.trim() : '';
  const result = await provider.getProducts({ ...parseListParams(rawParams), search: term || undefined });

  return (
    <Container size="7xl" className="pb-10">
      <PageHeader
        crumbs={[{ label: search.label }]}
        title={term ? <>{search.resultsFor(term)}</> : search.allProducts}
        subtitle={search.itemsFound(result.total)}
      />
      <ProductListing result={result} basePath="/product/search" rawParams={rawParams} />
    </Container>
  );
}
