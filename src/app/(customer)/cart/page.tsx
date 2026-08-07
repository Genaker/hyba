import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { cartSubtotal, getCartLines } from '@/lib/cart';
import { updateCartAction } from '@/lib/actions';
import { formatMoney } from '@/lib/format';
import { getDictionary } from '@/lib/i18n';
import Container from '@/theme/Container';
import QuantityStepper from '@/components/QuantityStepper';
import SubmitButton from '@/components/SubmitButton';
import { productUrlWithOptions } from '@/lib/urls';

export async function generateMetadata(): Promise<Metadata> {
  const { cart } = await getDictionary();
  return { title: cart.title };
}

export default async function CartPage() {
  const [lines, dictionary] = await Promise.all([getCartLines(), getDictionary()]);
  const { cart } = dictionary;
  const subtotal = cartSubtotal(lines);
  const shipping = subtotal >= 100 || lines.length === 0 ? 0 : 5;

  return (
    <Container size="5xl" className="cart-page py-10">
      <h1 className="cart-title text-3xl font-bold">{cart.title}</h1>

      {lines.length === 0 ? (
        <div className="cart-empty mt-8 rounded-xl bg-mist p-12 text-center">
          <p className="cart-empty-message text-gray-600">{cart.empty}</p>
          <Link href="/" className="cart-empty-cta mt-4 inline-block rounded-lg bg-brand-600 px-6 py-2.5 font-semibold text-white hover:bg-brand-700">
            {cart.startShopping}
          </Link>
        </div>
      ) : (
        <div className="cart-layout mt-8 grid gap-8 lg:grid-cols-[1fr_300px]">
          <ul className="cart-items divide-y divide-mist rounded-xl border border-mist">
            {lines.map((line) => (
              <li key={line.product.sku} className="cart-item flex gap-4 p-4">
                {line.product.image && (
                  <Image
                    src={line.product.image} alt="" width={96} height={96}
                    className="cart-item-image h-24 w-24 rounded-lg border border-mist object-contain"
                  />
                )}
                <div className="cart-item-details flex flex-1 flex-col">
                  <Link
                    href={productUrlWithOptions(line.product, line.selectedOptions)}
                    className="cart-item-name font-medium hover:text-brand-600"
                  >
                    {line.product.title}
                  </Link>
                  <p className="cart-item-sku text-xs text-gray-500">{line.product.sku}</p>

                  {line.selectedOptions.length > 0 && (
                    <details open className="cart-item-options mt-1 text-sm text-gray-600">
                      <summary className="cart-item-options-toggle cursor-pointer select-none font-medium text-ink">{cart.seeDetails}</summary>
                      <dl className="cart-item-options-list mt-1 space-y-0.5">
                        {line.selectedOptions.map((option) => (
                          <div key={option.label} className="cart-item-option flex gap-1">
                            <dt className="cart-item-option-label font-medium text-ink">{option.label}:</dt>
                            <dd className="cart-item-option-value">{option.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </details>
                  )}

                  <p className="cart-item-unit-price mt-1 text-sm text-gray-600">{cart.each(formatMoney(line.unitPrice))}</p>

                  <div className="cart-item-actions mt-2 flex items-center gap-4">
                    <form action={updateCartAction} className="cart-item-qty flex items-center gap-2">
                      <input type="hidden" name="sku" value={line.product.sku} className="cart-item-qty-sku" />
                      <label className="cart-item-qty-label text-sm text-gray-600" htmlFor={`qty-${line.product.sku}`}>{cart.qty}</label>
                      <QuantityStepper sku={line.product.sku} quantity={line.quantity} />
                      <SubmitButton className="cart-item-update text-sm font-medium text-brand-600 underline" pendingText={cart.updating}>
                        {cart.update}
                      </SubmitButton>
                    </form>
                    <form action={updateCartAction} className="cart-item-remove">
                      <input type="hidden" name="sku" value={line.product.sku} className="cart-item-remove-sku" />
                      <input type="hidden" name="quantity" value={0} className="cart-item-remove-qty" />
                      <SubmitButton className="cart-item-remove-button text-sm text-red-600 underline" pendingText={cart.removing}>
                        {cart.remove}
                      </SubmitButton>
                    </form>
                  </div>
                </div>
                <p className="cart-item-price font-semibold">{formatMoney(line.totalPrice)}</p>
              </li>
            ))}
          </ul>

          <aside className="cart-summary h-fit rounded-xl border border-mist p-6">
            <h2 className="cart-summary-title text-lg font-semibold">{cart.summary}</h2>
            <dl className="cart-totals mt-4 space-y-2 text-sm">
              <div className="cart-totals-row flex justify-between"><dt className="cart-totals-label">{cart.subtotal}</dt><dd className="cart-totals-value">{formatMoney(subtotal)}</dd></div>
              <div className="cart-totals-row flex justify-between">
                <dt className="cart-totals-label">{cart.shipping}</dt>
                <dd className="cart-totals-value">{shipping === 0 ? cart.free : formatMoney(shipping)}</dd>
              </div>
              <div className="cart-totals-row flex justify-between border-t border-mist pt-2 text-base font-bold">
                <dt className="cart-totals-label">{cart.total}</dt><dd className="cart-totals-value">{formatMoney(subtotal + shipping)}</dd>
              </div>
            </dl>
            <Link
              href="/checkout"
              className="cart-checkout mt-5 block rounded-lg bg-brand-600 py-3 text-center font-semibold text-white hover:bg-brand-700"
            >
              {cart.proceedToCheckout}
            </Link>
            {subtotal < 100 && (
              <p className="cart-summary-hint mt-3 text-xs text-gray-500">
                {cart.addMoreForFreeShipping(formatMoney(100 - subtotal))}
              </p>
            )}
          </aside>
        </div>
      )}
    </Container>
  );
}
