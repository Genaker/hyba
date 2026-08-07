import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { provider } from '@/lib/provider';
import { resolveRoute } from '@/lib/url-resolver';
import { categoryCrumbs } from '@/lib/breadcrumbs';
import { getDictionary } from '@/lib/i18n';
import Container from '@/theme/Container';
import Breadcrumbs from '@/components/Breadcrumbs';
import ProductDetail from '@/theme/ProductDetail';
import ProductRecommendations from '@/components/ProductRecommendations';
import CategoryContent from '@/theme/CategoryContent';
import CmsContent from '@/theme/CmsContent';
import type { Product } from '@/lib/types';

type PageProps = {
  params: Promise<{ path: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolution = await resolveRoute((await params).path);
  switch (resolution.type) {
    case 'product':
      return {
        title: resolution.product.title,
        description: resolution.product.shortDescription?.slice(0, 160) ?? resolution.product.title,
      };
    case 'category':
      return { title: resolution.category.title, description: `Shop ${resolution.category.title} — B2B pricing and volume discounts.` };
    case 'content':
      return { title: resolution.page.title, description: resolution.page.title };
    case 'not-found':
      return {};
  }
}

async function ProductRoute({ product, rawParams }: { product: Product; rawParams: Record<string, string | string[] | undefined> }) {
  // Not awaited here — ProductDetail Suspense-streams this in on hydrated
  // routes (see its own comment) so the main product content isn't blocked
  // on it; non-hydrated routes await it themselves before rendering.
  const relatedPromise = provider.getRelatedProducts(product, 5);
  const crumbs = product.categoryPath
    ? [
        ...(await categoryCrumbs((await provider.getCategoryByPath(product.categoryPath))!)).map((crumb) => ({
          ...crumb,
          href: crumb.href ?? `/${product.categoryPath}`,
        })),
        { label: product.title },
      ]
    : [{ label: product.title }];
  const { product: productLabels } = await getDictionary();
  return (
    <Container size="7xl" className="pb-10">
      <Breadcrumbs crumbs={crumbs} />
      <ProductDetail product={product} related={relatedPromise} rawParams={rawParams} />
      {/* AI recommendation rails — CLIENT-lazy (fetch on scroll-into-view), so
          this non-critical content never blocks the server render. Each rail
          declares its flavor + engine mode ('auto' = embedding KNN when vectors
          exist, standard otherwise); the ✦ AI badge shows only when semantics
          actually served. Zero-JS mode omits them by design. */}
      <ProductRecommendations productId={product.id} categoryPath={product.categoryPath} flavor="similar" mode="auto" title={productLabels.similarProducts} aiLabel={productLabels.aiRecommendation} />
      <ProductRecommendations productId={product.id} categoryPath={product.categoryPath} flavor="accessories" mode="auto" title={productLabels.accessories} aiLabel={productLabels.aiRecommendation} />
      <ProductRecommendations productId={product.id} categoryPath={product.categoryPath} flavor="also-like" mode="auto" title={productLabels.youMayAlsoLike} aiLabel={productLabels.aiRecommendation} />
    </Container>
  );
}

export default async function RouteDispatcherPage({ params, searchParams }: PageProps) {
  const [{ path }, rawParams] = await Promise.all([params, searchParams]);
  const resolution = await resolveRoute(path);

  switch (resolution.type) {
    case 'product':
      return <ProductRoute product={resolution.product} rawParams={rawParams} />;
    case 'category':
      return <CategoryContent category={resolution.category} rawParams={rawParams} />;
    case 'content':
      return <CmsContent cmsPage={resolution.page} />;
    case 'not-found':
      notFound();
  }
}
