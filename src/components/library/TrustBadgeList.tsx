export type TrustBadge = { title: string; text?: string };

/** Row of reassurance items (free shipping / returns / secure checkout). */
export default function TrustBadgeList({ badges }: { badges: TrustBadge[] }) {
  return (
    <ul className="trust-badge-list flex flex-wrap justify-center gap-8">
      {badges.map((badge) => (
        <li key={badge.title} className="trust-badge text-center">
          <p className="trust-badge-title text-sm font-semibold text-ink">{badge.title}</p>
          {badge.text && <p className="trust-badge-text text-xs text-gray-500">{badge.text}</p>}
        </li>
      ))}
    </ul>
  );
}
