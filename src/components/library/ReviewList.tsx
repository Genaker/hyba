import RatingStars from './RatingStars';

export type Review = { author: string; rating: number; date: string; title?: string; text: string };

/** Customer review list with star ratings. */
export default function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return <p className="review-list-empty text-sm text-gray-500">No reviews yet.</p>;
  return (
    <ul className="review-list divide-y divide-mist">
      {reviews.map((review) => (
        <li key={`${review.author}-${review.date}`} className="review-item py-4">
          <div className="review-item-head flex items-center gap-3">
            <RatingStars value={review.rating} />
            {review.title && <span className="review-item-title font-semibold text-ink">{review.title}</span>}
          </div>
          <p className="review-item-meta mt-0.5 text-xs text-gray-500">
            {review.author} — {review.date}
          </p>
          <p className="review-item-text mt-2 text-sm leading-relaxed text-gray-600">{review.text}</p>
        </li>
      ))}
    </ul>
  );
}
