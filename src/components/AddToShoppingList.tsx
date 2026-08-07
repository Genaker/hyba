import Link from 'next/link';
import { getSessionUser } from '@/lib/session';
import { getShoppingLists } from '@/lib/shopping-lists';
import { addToShoppingListAction } from '@/lib/actions';
import { getDictionary } from '@/lib/i18n';

/** Product-page control: pick a shopping list (or default) and add the item. */
export default async function AddToShoppingList({ sku, back }: { sku: string; back: string }) {
  const [user, dictionary] = await Promise.all([getSessionUser(), getDictionary()]);
  const { header, product } = dictionary;
  if (!user) {
    return (
      <p className="add-to-shopping-list mt-3 text-sm text-gray-600">
        <Link href={`/login?back=${encodeURIComponent(back)}`} className="add-to-shopping-list-link font-medium text-brand-600 underline">
          {header.signIn}
        </Link>{' '}
        {product.signInToAddToList}
      </p>
    );
  }

  const lists = getShoppingLists(user.email);
  return (
    <form action={addToShoppingListAction} className="add-to-shopping-list mt-3 flex items-center gap-2 text-sm">
      <input className="add-to-shopping-list-param" type="hidden" name="sku" value={sku} />
      <input className="add-to-shopping-list-param" type="hidden" name="back" value={back} />
      <input className="add-to-shopping-list-param" type="hidden" name="quantity" value={1} />
      {lists.length > 0 && (
        <label className="add-to-shopping-list-field">
          <span className="add-to-shopping-list-label sr-only">Shopping list</span>
          <select name="list" className="add-to-shopping-list-select rounded-lg border border-gray-300 bg-paper px-2 py-1.5 focus:border-brand-500 focus:outline-none">
            {lists.map((list) => (
              <option key={list.id} className="add-to-shopping-list-option" value={list.id}>{list.name}</option>
            ))}
          </select>
        </label>
      )}
      <button type="submit" className="add-to-shopping-list-submit rounded-lg border border-brand-600 px-4 py-1.5 font-medium text-brand-600 hover:bg-brand-50">
        {product.addToShoppingList}
      </button>
    </form>
  );
}
