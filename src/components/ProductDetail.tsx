import { Suspense } from 'react';
import Image from 'next/image';
import ProductGallery from './ProductGallery';
import ProductTile, { ProductTileSkeleton } from './ProductTile';
import AddToCartButton from './AddToCartButton';
import AddToShoppingList from './AddToShoppingList';
import WishlistButton from './WishlistButton';
import CompareButton from './CompareButton';
import VanillaIsland from './VanillaIsland';
import ConfigurablePanel from './hyba/ConfigurablePanel';
import { formatMoney } from '@/lib/format';
import { isHydratedPath } from '@/lib/hydration';
import { getDictionary, type Dictionary } from '@/lib/i18n';
import type { Product } from '@/lib/types';
import { productUrl } from '@/lib/urls';

function RelatedProductsList({ related, dictionary, title }: { related: Product[]; dictionary: Dictionary; title: string }) {
  if (related.length === 0) return null;
  return (
    <section className="related-products mt-14">
      <h2 className="related-products-title mb-4 text-2xl font-bold">{title}</h2>
      <ul className="related-products-items grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-5">
        {related.map((relatedProduct) => (
          <li key={relatedProduct.id} className="related-products-item">
            <ProductTile product={relatedProduct} dictionary={dictionary} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Awaits the still-pending promise inside the Suspense boundary — this is what lets
 * the rest of the page stream out first instead of waiting on it. */
async function RelatedProductsAsync({ relatedPromise, dictionary, title }: { relatedPromise: Promise<Product[]>; dictionary: Dictionary; title: string }) {
  const related = await relatedPromise;
  return <RelatedProductsList related={related} dictionary={dictionary} title={title} />;
}

/** Reuses the exact real grid classes/gaps so the reserved row height matches the eventual
 * real content at every breakpoint — see ProductTileSkeleton for why this beats guessed heights. */
function RelatedProductsSkeleton() {
  return (
    <section aria-hidden className="related-products mt-14">
      <div className="related-products-title mb-4 h-8 w-56 animate-pulse rounded bg-mist" />
      <ul className="related-products-items grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <li key={index} className="related-products-item">
            <ProductTileSkeleton />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function ProductDetail({
  product,
  related,
  rawParams = {},
}: {
  product: Product;
  related: Promise<Product[]>;
  rawParams?: Record<string, string | string[] | undefined>;
}) {
  const dictionary = await getDictionary();
  const { product: t } = dictionary;
  const unitPrice = product.prices[0]?.amount;
  const pathname = productUrl(product);
  const hydrated = isHydratedPath(pathname);
  // Variant swatches are an Alpine island (ConfigurablePanel/initConfigurableOptions) — unlike
  // the old React version this works on every route regardless of `hydrated` (Alpine doesn't
  // need React hydration), so the only gate is whether the product actually has variants.
  const showVariantPanel = product.variants.length > 0;
  // Suspense's streaming reveal only makes sense (and was verified) on hydrated routes —
  // on zero/hybrid it's simpler and safer to just await it like everything else on the page.
  const relatedResolved = hydrated ? null : await related;

  const wishlistAndCompareActions = (
    <>
      <WishlistButton sku={product.sku} back={pathname} addLabel={t.addToWishlist} removeLabel={t.removeFromWishlist} />
      <CompareButton sku={product.sku} back={pathname} addLabel={t.addToCompare} removeLabel={t.removeFromCompare} fullLabel={t.compareFull} />
    </>
  );

  return (
    <>
      {showVariantPanel ? (
        <ConfigurablePanel
          product={product}
          rawParams={rawParams}
          labels={{
            sku: t.sku,
            brand: t.brand,
            availability: t.availability,
            inStock: t.inStock,
            outOfStock: t.outOfStock,
            quantity: t.quantity,
            addToCart: t.addToCart,
            asLowAs: t.asLowAs,
            description: t.description,
            and: t.and,
            pleaseSelectPrefix: t.pleaseSelectPrefix,
            pleaseSelectSuffix: t.pleaseSelectSuffix,
            combinationUnavailable: t.combinationUnavailable,
          }}
          shoppingList={product.inStock ? <AddToShoppingList sku={product.sku} back={pathname} /> : null}
          actions={wishlistAndCompareActions}
        />
      ) : (
        <div className="product-info-main grid gap-10 lg:grid-cols-2">
          <div className="product-media">
            <ProductGallery product={product} zoomLabel={t.enlargeImage} closeLabel={t.closeImage} />
          </div>

          <div className="product-info-content">
            <h1 className="page-title text-3xl font-bold">{product.title}</h1>
            <dl className="product-info-sku mt-3 flex flex-wrap gap-x-8 gap-y-1 text-sm text-gray-600">
              <div className="product-info-sku-item flex gap-2"><dt className="product-info-label font-medium">{t.sku}:</dt><dd className="product-info-value">{product.sku}</dd></div>
              {product.brand && <div className="product-info-brand flex gap-2"><dt className="product-info-label font-medium">{t.brand}:</dt><dd className="product-info-value">{product.brand}</dd></div>}
              <div className="product-info-stock flex gap-2">
                <dt className="product-info-label font-medium">{t.availability}:</dt>
                <dd className={`product-info-value ${product.inStock ? 'text-brand-600' : 'text-red-600'}`}>
                  {product.inStock ? t.inStock : t.outOfStock}
                </dd>
              </div>
            </dl>

            {unitPrice !== undefined && (
              <p className="price mt-5 text-3xl font-bold">{formatMoney(unitPrice)}</p>
            )}

            {product.prices.length > 1 && (
              <table className="price-tiers mt-4 text-sm">
                <caption className="price-tiers-caption mb-1 text-left font-medium text-gray-600">{t.volumePricing}</caption>
                <thead className="price-tiers-head">
                  <tr className="price-tiers-row text-left text-gray-500">
                    <th className="price-tiers-col pr-6 font-medium">{t.quantityColumn}</th>
                    <th className="price-tiers-col font-medium">{t.pricePerItem}</th>
                  </tr>
                </thead>
                <tbody className="price-tiers-body">
                  {product.prices.map((tier) => (
                    <tr key={tier.quantity} className="price-tiers-row border-t border-mist">
                      <td className="price-tiers-qty py-1.5 pr-6">{tier.quantity}+</td>
                      <td className="price-tiers-price">{formatMoney(tier.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {product.inStock && (
              <>
                <AddToCartButton
                  sku={product.sku}
                  back={pathname}
                  tiers={product.prices}
                  quantityLabel={t.quantity}
                  addToCartLabel={t.addToCart}
                />
                <AddToShoppingList sku={product.sku} back={pathname} />
                <VanillaIsland
                  src="/js/price-calc.js"
                  pathname={pathname}
                  imports={['/js/lib/money.js', '/js/lib/dom.js']}
                />
              </>
            )}

            <div className="product-actions-extra mt-2 flex flex-wrap items-center gap-2">{wishlistAndCompareActions}</div>

            {product.description && (
              <section className="product-description mt-8 border-t border-mist pt-6">
                <h2 className="product-description-title mb-2 text-lg font-semibold">{t.description}</h2>
                <div className="product-description-content rich-text text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: product.description }} />
              </section>
            )}
          </div>
        </div>
      )}

      {product.attributes?.length > 0 && (
        <section className="product-specs mt-10 border-t border-mist pt-8">
          <h2 className="product-specs-title mb-4 text-2xl font-bold">{t.specifications}</h2>
          <div className="product-specs-list divide-y divide-mist rounded-xl border border-mist">
            {product.attributes.map((group: any, index: number) => (
              <details key={group.family ?? index} open={index === 0} className="product-specs-group group">
                <summary className="product-specs-group-title cursor-pointer list-none px-5 py-3.5 text-base font-semibold text-ink [&::-webkit-details-marker]:hidden">
                  <span aria-hidden className="product-specs-group-marker mr-1 inline-block w-4 text-gray-400 transition-transform group-open:rotate-90">▸</span>
                  {group.family ?? t.additionalInformation}
                </summary>
                <ul className="product-specs-items space-y-2 px-5 pb-5 text-sm text-gray-700">
                  {group.attributes.map((attribute: any, attributeIndex: number) => (
                    <li key={attributeIndex} className="product-specs-item flex gap-2">
                      <span aria-hidden className="product-specs-item-marker text-gray-400">•</span>
                      {attribute.value !== null ? (
                        <span className="product-specs-item-text"><span className="product-specs-item-label font-medium text-ink">{attribute.label}:</span> {attribute.value}</span>
                      ) : (
                        <span className="product-specs-item-text">{attribute.label}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </section>
      )}

      {hydrated ? (
        <Suspense fallback={<RelatedProductsSkeleton />}>
          <RelatedProductsAsync relatedPromise={related} dictionary={dictionary} title={t.relatedProducts} />
        </Suspense>
      ) : (
        <RelatedProductsList related={relatedResolved!} dictionary={dictionary} title={t.relatedProducts} />
      )}
    </>
  );
}
