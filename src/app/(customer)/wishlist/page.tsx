import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getWishlistLines } from '@/lib/wishlist';
import { removeFromWishlistAction, wishlistToCartAction } from '@/lib/actions';
import { getDictionary } from '@/lib/i18n';
import Container from '@/theme/Container';
import AddToCartButton from '@/components/AddToCartButton';
import SubmitButton from '@/components/SubmitButton';
import { formatMoney } from '@/lib/format';
import { productUrl } from '@/lib/urls';

export async function generateMetadata(): Promise<Metadata> {
  const { wishlist } = await getDictionary();
  return { title: wishlist.title };
}

export default async function WishlistPage() {
  const [lines, dictionary] = await Promise.all([getWishlistLines(), getDictionary()]);
  const { wishlist, product: t } = dictionary;

  return (
    <Container size="5xl" className="wishlist-page py-10">
      <h1 className="wishlist-title text-3xl font-bold">{wishlist.title}</h1>

      {lines.length === 0 ? (
        <div className="wishlist-empty mt-8 rounded-xl bg-mist p-12 text-center">
          <p className="wishlist-empty-message text-gray-600">{wishlist.empty}</p>
        </div>
      ) : (
        <>
          <ul className="wishlist-items mt-8 divide-y divide-mist rounded-xl border border-mist">
            {lines.map((line) => (
              <li key={line.product.sku} className="wishlist-item flex flex-wrap items-center gap-4 p-4">
                {line.product.image && (
                  <Image
                    src={line.product.image} alt="" width={80} height={80}
                    className="wishlist-item-image h-20 w-20 rounded-lg border border-mist object-contain"
                  />
                )}
                <div className="wishlist-item-details min-w-0 flex-1">
                  <Link href={productUrl(line.product)} className="wishlist-item-name font-medium hover:text-brand-600">
                    {line.product.title}
                  </Link>
                  <p className="wishlist-item-sku text-xs text-gray-500">{line.product.sku}</p>
                  {line.product.prices[0] && (
                    <p className="wishlist-item-price mt-1 text-sm font-semibold">{formatMoney(line.product.prices[0].amount)}</p>
                  )}
                </div>
                <div className="wishlist-item-actions flex shrink-0 items-center gap-3">
                  {line.product.inStock && (
                    <AddToCartButton
                      sku={line.product.sku}
                      back="/wishlist"
                      compact
                      quantityLabel={t.quantity}
                      addToCartLabel={t.addToCart}
                    />
                  )}
                  <form action={removeFromWishlistAction} className="wishlist-item-remove">
                    <input type="hidden" name="sku" value={line.product.sku} />
                    <input type="hidden" name="back" value="/wishlist" />
                    <SubmitButton className="wishlist-item-remove-button text-sm text-red-600 underline" pendingText={wishlist.remove}>
                      {wishlist.remove}
                    </SubmitButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>

          <form action={wishlistToCartAction} className="wishlist-add-all mt-6">
            <SubmitButton className="wishlist-add-all-button rounded-lg bg-brand-600 px-6 py-2.5 font-semibold text-white hover:bg-brand-700">
              {wishlist.addAllToCart}
            </SubmitButton>
          </form>
        </>
      )}
    </Container>
  );
}
