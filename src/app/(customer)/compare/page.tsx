import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getCompareLines } from '@/lib/compare';
import { removeFromCompareAction } from '@/lib/actions';
import { getDictionary } from '@/lib/i18n';
import Container from '@/theme/Container';
import AddToCartButton from '@/components/AddToCartButton';
import SubmitButton from '@/components/SubmitButton';
import { formatMoney } from '@/lib/format';
import { productUrl } from '@/lib/urls';
import type { Product } from '@/lib/types';

export async function generateMetadata(): Promise<Metadata> {
  const { compare } = await getDictionary();
  return { title: compare.title };
}

/** Union of every distinct (family, label) spec row across the compared products, in
 * first-seen order, so the table has one row per spec regardless of which products have it. */
function mergedSpecRows(products: Product[]): { family: string; label: string }[] {
  const seen = new Set<string>();
  const rows: { family: string; label: string }[] = [];
  for (const product of products) {
    for (const group of product.attributes ?? []) {
      const family = group.family ?? 'Specifications';
      for (const attribute of group.attributes ?? []) {
        const key = `${family}::${attribute.label}`;
        if (!seen.has(key)) {
          seen.add(key);
          rows.push({ family, label: attribute.label });
        }
      }
    }
  }
  return rows;
}

function specValue(product: Product, family: string, label: string): string | null {
  for (const group of product.attributes ?? []) {
    if ((group.family ?? 'Specifications') !== family) continue;
    const attribute = group.attributes?.find((candidate: { label: string }) => candidate.label === label);
    if (attribute) return attribute.value;
  }
  return null;
}

export default async function ComparePage() {
  const [lines, dictionary] = await Promise.all([getCompareLines(), getDictionary()]);
  const { compare, product: t } = dictionary;
  const products = lines.map((line) => line.product);
  const specRows = mergedSpecRows(products);

  return (
    <Container size="7xl" className="compare-page py-10">
      <h1 className="compare-title text-3xl font-bold">{compare.title}</h1>

      {lines.length === 0 ? (
        <div className="compare-empty mt-8 rounded-xl bg-mist p-12 text-center">
          <p className="compare-empty-message text-gray-600">{compare.empty}</p>
        </div>
      ) : (
        <div className="compare-table-wrapper mt-8 overflow-x-auto">
          <table className="compare-table w-full border-collapse text-sm">
            <tbody>
              <tr className="compare-row compare-row-image">
                <th className="compare-row-label w-40 shrink-0 p-3 text-left align-bottom font-medium text-gray-500" />
                {products.map((product) => (
                  <td key={product.sku} className="compare-cell w-56 min-w-56 border-b border-mist p-3 align-bottom">
                    {product.image && (
                      <Image src={product.image} alt="" width={160} height={160} className="compare-cell-image h-40 w-40 rounded-lg border border-mist object-contain" />
                    )}
                  </td>
                ))}
              </tr>
              <tr className="compare-row compare-row-title">
                <th className="compare-row-label p-3 text-left font-medium text-gray-500" />
                {products.map((product) => (
                  <td key={product.sku} className="compare-cell border-b border-mist p-3 font-semibold">
                    <Link href={productUrl(product)} className="compare-cell-name hover:text-brand-600">{product.title}</Link>
                  </td>
                ))}
              </tr>
              <tr className="compare-row compare-row-price">
                <th className="compare-row-label p-3 text-left font-medium text-gray-500">{t.sku}</th>
                {products.map((product) => (
                  <td key={product.sku} className="compare-cell border-b border-mist p-3">{product.sku}</td>
                ))}
              </tr>
              {products.some((product) => product.brand) && (
                <tr className="compare-row compare-row-brand">
                  <th className="compare-row-label p-3 text-left font-medium text-gray-500">{t.brand}</th>
                  {products.map((product) => (
                    <td key={product.sku} className="compare-cell border-b border-mist p-3">{product.brand ?? '—'}</td>
                  ))}
                </tr>
              )}
              <tr className="compare-row compare-row-availability">
                <th className="compare-row-label p-3 text-left font-medium text-gray-500">{t.availability}</th>
                {products.map((product) => (
                  <td key={product.sku} className={`compare-cell border-b border-mist p-3 ${product.inStock ? 'text-brand-600' : 'text-red-600'}`}>
                    {product.inStock ? t.inStock : t.outOfStock}
                  </td>
                ))}
              </tr>
              <tr className="compare-row compare-row-cost">
                <th className="compare-row-label p-3 text-left font-medium text-gray-500">{compare.title}</th>
                {products.map((product) => (
                  <td key={product.sku} className="compare-cell border-b border-mist p-3 text-lg font-bold">
                    {product.prices[0] ? formatMoney(product.prices[0].amount) : '—'}
                  </td>
                ))}
              </tr>

              {specRows.map(({ family, label }) => (
                <tr key={`${family}::${label}`} className="compare-row compare-row-spec">
                  <th className="compare-row-label p-3 text-left font-medium text-gray-500">{label}</th>
                  {products.map((product) => (
                    <td key={product.sku} className="compare-cell border-b border-mist p-3 text-gray-700">
                      {specValue(product, family, label) ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}

              <tr className="compare-row compare-row-actions">
                <th className="compare-row-label p-3 text-left font-medium text-gray-500" />
                {products.map((product) => (
                  <td key={product.sku} className="compare-cell p-3">
                    <div className="compare-cell-actions flex flex-col items-start gap-2">
                      {product.inStock && (
                        <AddToCartButton sku={product.sku} back="/compare" compact quantityLabel={t.quantity} addToCartLabel={t.addToCart} />
                      )}
                      <form action={removeFromCompareAction} className="compare-cell-remove">
                        <input type="hidden" name="sku" value={product.sku} />
                        <input type="hidden" name="back" value="/compare" />
                        <SubmitButton className="compare-cell-remove-button text-sm text-red-600 underline" pendingText={compare.remove}>
                          {compare.remove}
                        </SubmitButton>
                      </form>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </Container>
  );
}
