import type { MetadataRoute } from 'next';
import { provider } from '@/lib/provider';
import { productUrl, categoryUrl } from '@/lib/urls';

// Request-time, not build-time: the catalog comes from the gateway, which
// isn't (and shouldn't be) running during `next build`.
export const dynamic = 'force-dynamic';

const baseUrl = process.env.SITE_URL ?? 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([
    provider.getCategories(),
    provider.getProducts({ pageSize: 1000 }),
  ]);
  return [
    { url: baseUrl },
    ...categories.filter((category) => category.path).map((category) => ({ url: `${baseUrl}${categoryUrl(category)}` })),
    ...products.items.map((product) => ({ url: `${baseUrl}${productUrl(product)}` })),
  ];
}
