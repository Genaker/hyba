/** Image tile linking to a category. Plain <img>/<a>: library components stay
 *  framework-portable; wrap with next/image + Link at the use site if needed. */
export default function CategoryCard({ title, href, image, productCount }: { title: string; href: string; image: string | null; productCount?: number }) {
  return (
    <a href={href} className="category-card block overflow-hidden rounded-xl border border-mist transition-colors hover:border-brand-500">
      {image ? (
        <img src={image} alt="" className="category-card-image aspect-[4/3] w-full object-cover" />
      ) : (
        <span aria-hidden className="category-card-placeholder block aspect-[4/3] w-full bg-mist" />
      )}
      <span className="category-card-body block p-3">
        <span className="category-card-title block font-semibold text-ink">{title}</span>
        {productCount !== undefined && <span className="category-card-count block text-sm text-gray-500">{productCount} products</span>}
      </span>
    </a>
  );
}
