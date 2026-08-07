import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { getShoppingLists } from '@/lib/shopping-lists';
import { provider } from '@/lib/provider';
import { formatMoney, tierPrice } from '@/lib/format';
import {
  createShoppingListAction,
  deleteShoppingListAction,
  removeListItemAction,
  shoppingListToCartAction,
} from '@/lib/actions';
import Container from '@/theme/Container';
import SubmitButton from '@/components/SubmitButton';
import { productUrl } from '@/lib/urls';

export const metadata: Metadata = { title: 'Shopping Lists' };

export default async function ShoppingListsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login?back=/account/shopping-lists');
  const lists = getShoppingLists(user.email);

  return (
    <Container size="4xl" className="shopping-lists-page py-10">
      <div className="shopping-lists-header flex items-center justify-between">
        <h1 className="shopping-lists-title text-3xl font-bold">Shopping Lists</h1>
        <Link href="/account" className="shopping-lists-account-link text-sm font-medium text-brand-600 underline">My Account</Link>
      </div>

      <form action={createShoppingListAction} className="shopping-list-create mt-6 flex max-w-md gap-2">
        <label className="shopping-list-create-field flex-1">
          <span className="shopping-list-create-label sr-only">New list name</span>
          <input
            name="name" required placeholder="New list name (e.g. Monthly Restock)"
            className="shopping-list-create-input w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
        <SubmitButton className="shopping-list-create-submit rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          Create List
        </SubmitButton>
      </form>

      {lists.length === 0 ? (
        <p className="shopping-lists-empty mt-8 rounded-xl bg-mist p-10 text-center text-gray-600">
          No shopping lists yet — add products from any product page.
        </p>
      ) : (
        <div className="shopping-lists mt-8 space-y-6">
          {await Promise.all(lists.map(async (list) => {
            const lines = await Promise.all(
              list.items.map(async (item) => {
                const product = await provider.getProductBySku(item.sku);
                if (!product) return null;
                const unitPrice = tierPrice(product.prices, item.quantity);
                return { product, quantity: item.quantity, unitPrice, totalPrice: unitPrice * item.quantity };
              }),
            ).then((resolved) => resolved.filter((line) => line !== null));
            const listTotal = lines.reduce((sum, line) => sum + line.totalPrice, 0);

            return (
              <section key={list.id} className="shopping-list rounded-xl border border-mist p-5">
                <div className="shopping-list-header flex flex-wrap items-center justify-between gap-3">
                  <h2 className="shopping-list-title text-lg font-semibold">
                    {list.name} <span className="shopping-list-count text-sm font-normal text-gray-500">({lines.length} items)</span>
                  </h2>
                  <div className="shopping-list-actions flex items-center gap-3">
                    {lines.length > 0 && (
                      <form action={shoppingListToCartAction} className="shopping-list-tocart-form">
                        <input type="hidden" name="list" value={list.id} className="shopping-list-tocart-id" />
                        <SubmitButton
                          className="shopping-list-tocart rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
                          pendingText="Adding…"
                        >
                          Add All to Cart
                        </SubmitButton>
                      </form>
                    )}
                    <form action={deleteShoppingListAction} className="shopping-list-delete">
                      <input type="hidden" name="list" value={list.id} className="shopping-list-delete-id" />
                      <SubmitButton className="shopping-list-delete-button text-sm text-red-600 underline" pendingText="Deleting…">
                        Delete
                      </SubmitButton>
                    </form>
                  </div>
                </div>

                {lines.length > 0 && (
                  <>
                    <ul className="shopping-list-items mt-4 divide-y divide-mist">
                      {lines.map((line) => (
                        <li key={line.product.sku} className="shopping-list-item flex items-center gap-4 py-2.5">
                          <span className="shopping-list-item-sku w-16 shrink-0 text-xs text-gray-500">{line.product.sku}</span>
                          <Link
                            href={productUrl(line.product)}
                            className="shopping-list-item-name min-w-0 flex-1 truncate text-sm font-medium hover:text-brand-600"
                          >
                            {line.product.title}
                          </Link>
                          <span className="shopping-list-item-qty text-sm text-gray-600">×{line.quantity}</span>
                          <span className="shopping-list-item-price w-20 text-right text-sm font-semibold">{formatMoney(line.totalPrice)}</span>
                          <form action={removeListItemAction} className="shopping-list-item-remove">
                            <input type="hidden" name="list" value={list.id} className="shopping-list-item-remove-list" />
                            <input type="hidden" name="sku" value={line.product.sku} className="shopping-list-item-remove-sku" />
                            <SubmitButton className="shopping-list-item-remove-button text-xs text-red-600 underline" pendingText="…">
                              Remove
                            </SubmitButton>
                          </form>
                        </li>
                      ))}
                    </ul>
                    <p className="shopping-list-total mt-3 text-right text-sm font-semibold">Total: {formatMoney(listTotal)}</p>
                  </>
                )}
              </section>
            );
          }))}
        </div>
      )}
    </Container>
  );
}
