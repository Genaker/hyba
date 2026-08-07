/** Heart toggle as a form checkbox — parent form decides what saving means. */
export default function WishlistToggle({ name = 'wishlist', defaultChecked = false, label = 'Save for later' }: { name?: string; defaultChecked?: boolean; label?: string }) {
  return (
    <label className="wishlist-toggle inline-flex cursor-pointer items-center gap-1.5 text-sm text-gray-600 hover:text-ink">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="wishlist-toggle-input peer sr-only" />
      <span aria-hidden className="wishlist-toggle-icon text-lg text-gray-400 peer-checked:text-red-600">♥</span>
      {label}
    </label>
  );
}
