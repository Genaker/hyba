import RatingStars from './RatingStars';

/** Stars + "(12 reviews)" link to the reviews section. */
export default function ReviewSummary({ value, count, href = '#reviews' }: { value: number; count: number; href?: string }) {
  return (
    <span className="review-summary inline-flex items-center gap-1.5">
      <RatingStars value={value} />
      <a href={href} className="review-summary-count text-sm text-gray-500 hover:text-ink hover:underline">
        ({count} {count === 1 ? 'review' : 'reviews'})
      </a>
    </span>
  );
}
