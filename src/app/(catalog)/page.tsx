import Link from 'next/link';
import { provider } from '@/lib/provider';
import CmsContentBlock from '@/components/CmsContentBlock';
import ProductTile from '@/components/ProductTile';
import { getDictionary, type Dictionary } from '@/lib/i18n';
import type { Product } from '@/lib/types';

function ProductRail({ title, products, dictionary }: { title: string; products: Product[]; dictionary: Dictionary }) {
  if (products.length === 0) return null;
  return (
    <section className="product-rail mx-auto mt-12 max-w-7xl px-4">
      <h2 className="product-rail-title mb-4 text-2xl font-bold">{title}</h2>
      <ul className="product-rail-items grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-5">
        {products.map((product) => (
          <li key={product.id} className="product-rail-item">
            <ProductTile product={product} dictionary={dictionary} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function HomePage() {
  const [allProducts, dictionary, homeCmsBlock] = await Promise.all([
    provider.getProducts({ pageSize: 100 }),
    getDictionary(),
    // The homepage's CMS content block (CmsContent, id-addressed — not a routable CmsPage).
    // Like real Oro (whose homepage slider lives inside CMS content), the hero slider is
    // part of this block — authored per dataset in cms-content.json from its slides.json
    // data, styled via the whitelisted Tailwind classes (src/lib/cms-tailwind-classes.ts).
    // The product rails below stay typed components.
    provider.getCmsContentById('home'),
  ]);
  const { home } = dictionary;
  const featured = allProducts.items.filter((product) => product.isFeatured).slice(0, 5);
  const newArrivals = allProducts.items.filter((product) => product.isNewArrival).slice(0, 5);

  return (
    <>
      {homeCmsBlock && <CmsContentBlock block={homeCmsBlock} className="home-cms-content mx-auto max-w-7xl px-4" />}

      <ProductRail title={home.featuredProducts} products={featured} dictionary={dictionary} />
      <ProductRail title={home.newArrivals} products={newArrivals} dictionary={dictionary} />

      <section className="promo-blocks mx-auto mt-14 grid max-w-7xl gap-4 px-4 sm:grid-cols-3" data-region="promos">
        {[
          { title: 'Medical', text: 'Apparel, uniforms and patient care', href: '/medical' },
          { title: 'Industrial', text: 'Lighting products and headlamps', href: '/lighting-products' },
          { title: 'Office & Retail', text: 'Furniture, POS systems and printers', href: '/office-furniture' },
        ].map((promo) => (
          <Link
            key={promo.href}
            href={promo.href}
            className="promo-block rounded-xl border border-mist bg-mist/50 p-6 transition-colors hover:border-brand-500 hover:bg-brand-50"
          >
            <h3 className="promo-block-title text-lg font-semibold">{promo.title}</h3>
            <p className="promo-block-text mt-1 text-sm text-gray-600">{promo.text}</p>
            <span className="promo-block-link mt-3 inline-block text-sm font-medium text-brand-600">{home.browse}</span>
          </Link>
        ))}
      </section>
    </>
  );
}
