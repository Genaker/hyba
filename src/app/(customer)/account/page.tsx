import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { getOrdersByEmail } from '@/lib/orders';
import { logoutAction } from '@/lib/actions';
import { formatMoney } from '@/lib/format';
import { getDictionary } from '@/lib/i18n';
import Container from '@/theme/Container';

export const metadata: Metadata = { title: 'My Account' };

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login?back=/account');
  const orders = getOrdersByEmail(user.email);
  const { checkout } = await getDictionary();

  return (
    <Container size="4xl" className="account-page py-10">
      <div className="account-header flex items-center justify-between">
        <h1 className="account-title text-3xl font-bold">My Account</h1>
        <form action={logoutAction} className="account-signout">
          <button type="submit" className="account-signout-button text-sm font-medium text-brand-600 underline hover:text-brand-700">
            Sign out
          </button>
        </form>
      </div>

      <section className="account-info mt-6 rounded-xl border border-mist p-6">
        <h2 className="account-info-title text-lg font-semibold">Profile</h2>
        <dl className="account-info-list mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div className="account-info-row"><dt className="account-info-label font-medium text-gray-500">Name</dt><dd className="account-info-value">{user.firstName} {user.lastName}</dd></div>
          <div className="account-info-row"><dt className="account-info-label font-medium text-gray-500">Email</dt><dd className="account-info-value">{user.email}</dd></div>
        </dl>
      </section>

      <section className="account-lists mt-6 rounded-xl border border-mist p-6">
        <h2 className="account-lists-title text-lg font-semibold">Shopping Lists</h2>
        <p className="account-lists-note mt-2 text-sm text-gray-600">
          Save products for later and re-order them in one click.{' '}
          <Link href="/account/shopping-lists" className="account-lists-link font-medium text-brand-600 underline">
            Manage shopping lists →
          </Link>
        </p>
      </section>

      <section className="account-orders mt-6">
        <h2 className="account-orders-title text-lg font-semibold">Order History</h2>
        {orders.length === 0 ? (
          <p className="account-orders-empty mt-3 rounded-xl bg-mist p-8 text-center text-sm text-gray-600">No orders yet.</p>
        ) : (
          <div className="account-orders-wrap mt-3 overflow-x-auto rounded-xl border border-mist">
            <table className="account-orders-table w-full text-sm">
              <thead className="account-orders-head bg-mist/60 text-left">
                <tr className="account-orders-head-row">
                  <th className="account-orders-header px-4 py-3 font-semibold">Order</th>
                  <th className="account-orders-header px-4 py-3 font-semibold">Date</th>
                  <th className="account-orders-header px-4 py-3 font-semibold">Items</th>
                  <th className="account-orders-header px-4 py-3 font-semibold">Payment</th>
                  <th className="account-orders-header px-4 py-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="account-orders-body">
                {orders.map((order) => (
                  <tr key={order.id} className="order-row border-t border-mist">
                    <td className="order-id px-4 py-3 font-medium">{order.id}</td>
                    <td className="order-date px-4 py-3">{new Date(order.createdAt).toLocaleDateString('en-US')}</td>
                    <td className="order-items px-4 py-3">
                      {order.items
                        .map((item) => {
                          const options = item.selectedOptions.map((option) => option.value).join('/');
                          return `${item.name}${options ? ` (${options})` : ''} ×${item.quantity}`;
                        })
                        .join(', ')}
                    </td>
                    <td className="order-payment px-4 py-3">{checkout.paymentTermLabel(order.paymentTerm)}</td>
                    <td className="order-total px-4 py-3 text-right font-semibold">{formatMoney(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </Container>
  );
}
