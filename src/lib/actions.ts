'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { addToCart, cartSubtotal, clearCart, getCartLines, setCartQuantity } from './cart';
import { createSession, destroySession, getSessionUser } from './session';
import { provider } from './provider';
import { nextOrderId, saveOrder } from './orders';
import { addItemToList, createShoppingList, deleteShoppingList, getShoppingList, removeItemFromList } from './shopping-lists';
import { toggleWishlist, removeFromWishlist, readWishlist } from './wishlist';
import { toggleCompare, removeFromCompare } from './compare';
import { storefrontConfig } from './config';
import { isLocale, localeCookieName } from './i18n';
import { safeBack } from './urls';
import type { Address, Order } from './types';

/** Lets a guest view their own confirmations without an account. */
async function rememberGuestOrder(orderId: string): Promise<void> {
  const cookieStore = await cookies();
  const existing = cookieStore.get('guest_orders')?.value ?? '';
  const orderIds = existing ? existing.split(',') : [];
  cookieStore.set('guest_orders', [...orderIds, orderId].join(','), {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
  });
}

/**
 * Switches the UI language — see LanguageSwitcher.tsx. Sets the `locale` cookie (also the
 * cookie a live/store-aware DataProvider would read for locale/store-specific requests —
 * see src/lib/i18n/index.ts's header comment) and re-renders the current page in it.
 */
export async function setLocaleAction(formData: FormData) {
  const locale = String(formData.get('locale') ?? '');
  if (isLocale(locale)) {
    (await cookies()).set(localeCookieName, locale, {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  revalidatePath('/', 'layout');
  redirect(safeBack(formData.get('back'), '/'));
}

export async function addToCartAction(formData: FormData) {
  const sku = String(formData.get('sku') ?? '');
  const quantity = Math.max(1, Number(formData.get('quantity') ?? 1) || 1);
  if (sku) await addToCart(sku, quantity);
  revalidatePath('/', 'layout');
  redirect(safeBack(formData.get('back'), '/cart'));
}

export async function updateCartAction(formData: FormData) {
  const sku = String(formData.get('sku') ?? '');
  const quantity = Number(formData.get('quantity') ?? 0) || 0;
  if (sku) await setCartQuantity(sku, quantity);
  revalidatePath('/', 'layout');
  // `back` lets the mini cart remove a line without yanking the user to /cart;
  // the cart page's own forms send no `back` and keep landing there.
  redirect(safeBack(formData.get('back'), '/cart'));
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const user = await provider.findUser(email, password);
  if (!user) redirect('/login?error=1');
  await createSession(user.email);
  redirect(safeBack(formData.get('back'), '/account'));
}

export async function logoutAction() {
  await destroySession();
  redirect('/');
}

export async function placeOrderAction(formData: FormData) {
  const user = await getSessionUser();
  const guestEmail = String(formData.get('email') ?? '').trim();
  if (!user && !storefrontConfig.checkout.allowGuest) redirect('/login?back=/checkout');
  if (!user && !guestEmail.includes('@')) redirect('/checkout?error=email');
  const orderEmail = user?.email ?? guestEmail;

  const lines = await getCartLines();
  if (lines.length === 0) redirect('/cart');

  const shippingAddress: Address = {
    firstName: String(formData.get('firstName') ?? ''),
    lastName: String(formData.get('lastName') ?? ''),
    street: String(formData.get('street') ?? ''),
    city: String(formData.get('city') ?? ''),
    postalCode: String(formData.get('postalCode') ?? ''),
    country: String(formData.get('country') ?? 'US'),
    phone: String(formData.get('phone') ?? ''),
  };
  if (!shippingAddress.firstName || !shippingAddress.street || !shippingAddress.city) {
    redirect('/checkout?error=address');
  }

  const subtotal = cartSubtotal(lines);
  const shipping = subtotal >= 100 ? 0 : 5;
  const order: Order = {
    id: nextOrderId(),
    email: orderEmail,
    createdAt: new Date().toISOString(),
    items: lines.map((line) => ({
      sku: line.product.sku,
      name: line.product.title,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      totalPrice: line.totalPrice,
      selectedOptions: line.selectedOptions,
    })),
    shippingAddress,
    shippingMethod: shipping === 0 ? 'free' : 'flat',
    paymentTerm: 'net30',
    subtotal,
    shipping,
    total: subtotal + shipping,
    currency: 'USD',
  };
  saveOrder(order);
  await clearCart();
  if (!user) await rememberGuestOrder(order.id);
  revalidatePath('/', 'layout');
  redirect(`/checkout/confirmation?order=${order.id}`);
}

export async function addToShoppingListAction(formData: FormData) {
  const user = await getSessionUser();
  const backUrl = String(formData.get('back') ?? '/');
  if (!user) redirect(`/login?back=${encodeURIComponent(backUrl)}`);

  const sku = String(formData.get('sku') ?? '');
  const quantity = Math.max(1, Number(formData.get('quantity') ?? 1) || 1);
  const listId = String(formData.get('list') ?? '') || null;
  if (sku) addItemToList(user.email, listId, sku, quantity);
  redirect('/account/shopping-lists');
}

export async function createShoppingListAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect('/login?back=/account/shopping-lists');
  const name = String(formData.get('name') ?? '').trim();
  if (name) createShoppingList(user.email, name);
  redirect('/account/shopping-lists');
}

export async function removeListItemAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  removeItemFromList(user.email, String(formData.get('list') ?? ''), String(formData.get('sku') ?? ''));
  redirect('/account/shopping-lists');
}

export async function deleteShoppingListAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  deleteShoppingList(user.email, String(formData.get('list') ?? ''));
  redirect('/account/shopping-lists');
}

export async function shoppingListToCartAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const list = getShoppingList(user.email, String(formData.get('list') ?? ''));
  if (list) {
    for (const item of list.items) await addToCart(item.sku, item.quantity);
  }
  revalidatePath('/', 'layout');
  redirect('/cart');
}

export async function toggleWishlistAction(formData: FormData) {
  const sku = String(formData.get('sku') ?? '');
  if (sku) await toggleWishlist(sku);
  const backUrl = safeBack(formData.get('back'), '/');
  // Unlike addToCartAction (a stateless "add" — nothing on the page it redirects back to
  // depends on freshly reading the cart cookie), this button's own label/pressed-state
  // depends on reading the wishlist cookie on the EXACT page it redirects back to.
  // revalidatePath('/', 'layout') alone refreshes shared layout (the header count updates
  // correctly) but redirecting to the SAME URL a form was submitted from doesn't refetch that
  // page's own RSC payload on its own — revalidating the specific `back` path too is what
  // actually busts it, so the button reflects the new state instead of showing stale content
  // until an unrelated navigation happens.
  revalidatePath('/', 'layout');
  revalidatePath(backUrl);
  redirect(backUrl);
}

export async function removeFromWishlistAction(formData: FormData) {
  const sku = String(formData.get('sku') ?? '');
  if (sku) await removeFromWishlist(sku);
  const backUrl = safeBack(formData.get('back'), '/wishlist');
  revalidatePath('/', 'layout');
  revalidatePath(backUrl);
  redirect(backUrl);
}

export async function wishlistToCartAction() {
  const items = await readWishlist();
  for (const item of items) await addToCart(item.sku, 1);
  revalidatePath('/', 'layout');
  redirect('/cart');
}

export async function toggleCompareAction(formData: FormData) {
  const sku = String(formData.get('sku') ?? '');
  if (sku) await toggleCompare(sku);
  const backUrl = safeBack(formData.get('back'), '/');
  // See toggleWishlistAction's comment — same "redirect to the same page whose own content
  // depends on the just-mutated cookie" situation.
  revalidatePath('/', 'layout');
  revalidatePath(backUrl);
  redirect(backUrl);
}

export async function removeFromCompareAction(formData: FormData) {
  const sku = String(formData.get('sku') ?? '');
  if (sku) await removeFromCompare(sku);
  const backUrl = safeBack(formData.get('back'), '/compare');
  revalidatePath('/', 'layout');
  revalidatePath(backUrl);
  redirect(backUrl);
}

/** Quick Order Form: SKU+qty rows and/or pasted "SKU qty" lines → cart. */
export async function quickOrderAction(formData: FormData) {
  const entries: { sku: string; quantity: number }[] = [];

  for (let row = 1; row <= 8; row++) {
    const sku = String(formData.get(`sku_${row}`) ?? '').trim().toUpperCase();
    const quantity = Math.max(0, Number(formData.get(`qty_${row}`) ?? 0) || 0);
    if (sku && quantity > 0) entries.push({ sku, quantity });
  }
  for (const line of String(formData.get('paste') ?? '').split('\n')) {
    const [sku, quantityText] = line.trim().split(/[\s,;]+/);
    if (sku) entries.push({ sku: sku.toUpperCase(), quantity: Math.max(1, Number(quantityText) || 1) });
  }

  const invalidSkus: string[] = [];
  let addedCount = 0;
  for (const entry of entries) {
    const product = await provider.getProductBySku(entry.sku);
    if (product && product.inStock) {
      await addToCart(product.sku, entry.quantity);
      addedCount++;
    } else {
      invalidSkus.push(entry.sku);
    }
  }

  revalidatePath('/', 'layout');
  const params = new URLSearchParams();
  if (addedCount) params.set('added', String(addedCount));
  if (invalidSkus.length) params.set('invalid', invalidSkus.join(','));
  redirect(addedCount && !invalidSkus.length ? '/cart' : `/quick-order?${params}`);
}
