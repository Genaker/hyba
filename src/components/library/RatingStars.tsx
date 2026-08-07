/** 0–5 star rating, half-values rounded to nearest whole star for display. */
export default function RatingStars({ value, max = 5 }: { value: number; max?: number }) {
  const filled = Math.round(Math.min(Math.max(value, 0), max));
  return (
    <span className="rating-stars inline-flex" role="img" aria-label={`${value} out of ${max} stars`}>
      {Array.from({ length: max }, (_, index) => (
        <span key={index} aria-hidden className={`rating-star ${index < filled ? 'text-amber-500' : 'text-gray-300'}`}>
          ★
        </span>
      ))}
    </span>
  );
}
