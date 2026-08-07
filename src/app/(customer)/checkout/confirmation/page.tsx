import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { getOrderById } from '@/lib/orders';
import { getSessionUser } from '@/lib/session';
import { formatMoney } from '@/lib/format';
import { getDictionary } from '@/lib/i18n';
import Container from '@/theme/Container';

export async function generateMetadata(): Promise<Metadata> {
  const { checkout } = await getDictionary();
  return { title: checkout.confirmationTitle };
}

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ConfirmationPage({ searchParams }: PageProps) {
  const [rawParams, user, dictionary] = await Promise.all([searchParams, getSessionUser(), getDictionary()]);
  const { checkout } = dictionary;

  const orderId = typeof rawParams.order === 'string' ? rawParams.order : '';
  const order = getOrderById(orderId);
  // owner check: the signed-in user's email, or a guest order remembered in the cookie
  const guestOrderIds = ((await cookies()).get('guest_orders')?.value ?? '').split(',');
  const isOwner = order && (user?.email === order.email || guestOrderIds.includes(order.id));
  if (!order || !isOwner) notFound();

  const paymentTermLabel = checkout.paymentTermLabel(order.paymentTerm);

  return (
    <Container size="2xl" className="order-confirmation py-14 text-center">
      <p aria-hidden className="order-confirmation-icon mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-3xl">✓</p>
      <h1 className="order-confirmation-title mt-4 text-3xl font-bold">{checkout.thankYou}</h1>
      <p className="order-confirmation-message mt-2 text-gray-600">
        {checkout.orderPlacedPrefix} <span className="order-confirmation-number font-semibold text-ink">{order.id}</span>
        {checkout.orderPlacedSuffix(paymentTermLabel)}
      </p>

      <div className="order-summary mt-8 rounded-xl border border-mist p-6 text-left">
        <h2 className="order-summary-title text-lg font-semibold">{checkout.orderSummary}</h2>
        <ul className="order-summary-items mt-3 space-y-2 text-sm">
          {order.items.map((item) => (
            <li key={item.sku} className="order-summary-item flex justify-between">
              <span className="order-summary-item-name">
                {item.name} ×{item.quantity}
                {item.selectedOptions.length > 0 && (
                  <span className="order-summary-item-options ml-2 text-gray-500">
                    ({item.selectedOptions.map((option) => `${option.label}: ${option.value}`).join(', ')})
                  </span>
                )}
              </span>
              <span className="order-summary-item-price font-medium">{formatMoney(item.totalPrice)}</span>
            </li>
          ))}
        </ul>
        <dl className="order-summary-totals mt-4 space-y-1.5 border-t border-mist pt-3 text-sm">
          <div className="order-summary-totals-row flex justify-between"><dt className="order-summary-totals-label">{checkout.subtotal}</dt><dd className="order-summary-totals-value">{formatMoney(order.subtotal)}</dd></div>
          <div className="order-summary-totals-row flex justify-between"><dt className="order-summary-totals-label">{checkout.shippingMethodLabel(order.shippingMethod)}</dt><dd className="order-summary-totals-value">{order.shipping === 0 ? checkout.free : formatMoney(order.shipping)}</dd></div>
          <div className="order-summary-totals-row flex justify-between text-base font-bold"><dt className="order-summary-totals-label">{checkout.total}</dt><dd className="order-summary-totals-value">{formatMoney(order.total)}</dd></div>
        </dl>
        <p className="order-summary-shipping mt-4 text-sm text-gray-600">
          {checkout.shipsTo(order.shippingAddress.firstName, order.shippingAddress.lastName, order.shippingAddress.street, order.shippingAddress.city)}
        </p>
      </div>

      <div className="order-confirmation-actions mt-8 flex justify-center gap-4">
        {user && (
          <Link href="/account" className="order-confirmation-history rounded-lg border border-brand-600 px-6 py-2.5 font-semibold text-brand-600 hover:bg-brand-50">
            {checkout.orderHistory}
          </Link>
        )}
        <Link href="/" className="order-confirmation-continue rounded-lg bg-brand-600 px-6 py-2.5 font-semibold text-white hover:bg-brand-700">
          {checkout.continueShopping}
        </Link>
      </div>
    </Container>
  );
}
