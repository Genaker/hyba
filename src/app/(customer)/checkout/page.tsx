import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { cartSubtotal, getCartLines } from '@/lib/cart';
import { getSessionUser } from '@/lib/session';
import { placeOrderAction } from '@/lib/actions';
import { formatMoney } from '@/lib/format';
import { storefrontConfig } from '@/lib/config';
import { getDictionary } from '@/lib/i18n';
import Container from '@/theme/Container';
import SubmitButton from '@/components/SubmitButton';

export async function generateMetadata(): Promise<Metadata> {
  const { checkout } = await getDictionary();
  return { title: checkout.title };
}

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const inputClass = 'w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none';

export default async function CheckoutPage({ searchParams }: PageProps) {
  const [rawParams, user, dictionary] = await Promise.all([searchParams, getSessionUser(), getDictionary()]);
  const { checkout } = dictionary;
  if (!user && !storefrontConfig.checkout.allowGuest) redirect('/login?back=/checkout');

  const lines = await getCartLines();
  if (lines.length === 0) redirect('/cart');

  const subtotal = cartSubtotal(lines);
  const shipping = subtotal >= 100 ? 0 : 5;

  return (
    <Container size="5xl" className="checkout-page py-10">
      <h1 className="checkout-title text-3xl font-bold">{checkout.title}</h1>
      {rawParams.error === 'address' && (
        <p role="alert" className="checkout-error mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {checkout.errorAddress}
        </p>
      )}
      {rawParams.error === 'email' && (
        <p role="alert" className="checkout-error mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {checkout.errorEmail}
        </p>
      )}

      {/* One-step checkout: address + shipping + payment term + review in a single form */}
      <form action={placeOrderAction} className="checkout-form mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="checkout-main space-y-8">
          {!user && (
            <section className="checkout-contact">
              <h2 className="checkout-contact-title mb-3 text-lg font-semibold">{checkout.guestCheckoutTitle}</h2>
              <p className="checkout-contact-note mb-3 text-sm text-gray-600">
                {checkout.guestCheckoutNote}{' '}
                <Link href="/login?back=/checkout" className="checkout-contact-signin font-medium text-brand-600 underline">
                  {checkout.signInInstead}
                </Link>
              </p>
              <label className="checkout-field block text-sm sm:max-w-sm">
                <span className="checkout-field-label mb-1 block font-medium">{checkout.email}</span>
                <input name="email" type="email" required autoComplete="email" className={`checkout-field-input ${inputClass}`} />
              </label>
            </section>
          )}

          <section className="checkout-shipping">
            <h2 className="checkout-shipping-title mb-3 text-lg font-semibold">{checkout.shippingAddressTitle}</h2>
            <div className="checkout-shipping-fields grid gap-4 sm:grid-cols-2">
              <label className="checkout-field block text-sm">
                <span className="checkout-field-label mb-1 block font-medium">{checkout.firstName}</span>
                <input name="firstName" required defaultValue={user?.firstName} autoComplete="given-name" className={`checkout-field-input ${inputClass}`} />
              </label>
              <label className="checkout-field block text-sm">
                <span className="checkout-field-label mb-1 block font-medium">{checkout.lastName}</span>
                <input name="lastName" defaultValue={user?.lastName} autoComplete="family-name" className={`checkout-field-input ${inputClass}`} />
              </label>
              <label className="checkout-field block text-sm sm:col-span-2">
                <span className="checkout-field-label mb-1 block font-medium">{checkout.street}</span>
                <input name="street" required autoComplete="street-address" className={`checkout-field-input ${inputClass}`} />
              </label>
              <label className="checkout-field block text-sm">
                <span className="checkout-field-label mb-1 block font-medium">{checkout.city}</span>
                <input name="city" required autoComplete="address-level2" className={`checkout-field-input ${inputClass}`} />
              </label>
              <label className="checkout-field block text-sm">
                <span className="checkout-field-label mb-1 block font-medium">{checkout.postalCode}</span>
                <input name="postalCode" autoComplete="postal-code" className={`checkout-field-input ${inputClass}`} />
              </label>
              <label className="checkout-field block text-sm">
                <span className="checkout-field-label mb-1 block font-medium">{checkout.country}</span>
                <input name="country" defaultValue={checkout.defaultCountry} autoComplete="country-name" className={`checkout-field-input ${inputClass}`} />
              </label>
              <label className="checkout-field block text-sm">
                <span className="checkout-field-label mb-1 block font-medium">{checkout.phone}</span>
                <input name="phone" type="tel" autoComplete="tel" className={`checkout-field-input ${inputClass}`} />
              </label>
            </div>
          </section>

          <section className="checkout-shipping-method">
            <h2 className="checkout-shipping-method-title mb-3 text-lg font-semibold">{checkout.shippingMethodTitle}</h2>
            <p className="checkout-shipping-method-option rounded-lg border border-brand-500 bg-brand-50 px-4 py-3 text-sm font-medium">
              {checkout.shippingMethodLabel(shipping === 0 ? 'free' : 'flat')}
            </p>
          </section>

          <section className="checkout-payment">
            <h2 className="checkout-payment-title mb-3 text-lg font-semibold">{checkout.paymentTitle}</h2>
            <label className="checkout-payment-option flex items-center gap-3 rounded-lg border border-brand-500 bg-brand-50 px-4 py-3 text-sm font-medium">
              <input type="radio" name="payment" value="net30" defaultChecked className="checkout-payment-input accent-brand-600" />
              {checkout.paymentTermLabel('net30')}
            </label>
            <p className="checkout-payment-note mt-2 text-xs text-gray-500">{checkout.paymentNote}</p>
          </section>
        </div>

        <aside className="checkout-summary h-fit rounded-xl border border-mist p-6">
          <h2 className="checkout-summary-title text-lg font-semibold">{checkout.orderReview}</h2>
          <ul className="checkout-summary-items mt-4 space-y-2 text-sm">
            {lines.map((line) => (
              <li key={line.product.sku} className="checkout-summary-item flex justify-between gap-2">
                <span className="checkout-summary-item-name text-gray-700">{line.product.title} ×{line.quantity}</span>
                <span className="checkout-summary-item-price font-medium">{formatMoney(line.totalPrice)}</span>
              </li>
            ))}
          </ul>
          <dl className="checkout-totals mt-4 space-y-2 border-t border-mist pt-3 text-sm">
            <div className="checkout-totals-row flex justify-between"><dt className="checkout-totals-label">{checkout.subtotal}</dt><dd className="checkout-totals-value">{formatMoney(subtotal)}</dd></div>
            <div className="checkout-totals-row flex justify-between"><dt className="checkout-totals-label">{checkout.shipping}</dt><dd className="checkout-totals-value">{shipping === 0 ? checkout.free : formatMoney(shipping)}</dd></div>
            <div className="checkout-totals-row flex justify-between border-t border-mist pt-2 text-base font-bold">
              <dt className="checkout-totals-label">{checkout.total}</dt><dd className="checkout-totals-value">{formatMoney(subtotal + shipping)}</dd>
            </div>
          </dl>
          <SubmitButton
            className="place-order mt-5 w-full rounded-lg bg-brand-600 py-3 font-semibold text-white hover:bg-brand-700"
            pendingText={checkout.placingOrder}
          >
            {checkout.placeOrder}
          </SubmitButton>
        </aside>
      </form>
    </Container>
  );
}
