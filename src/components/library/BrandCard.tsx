/** Brand logo tile linking to the brand's listing. */
export default function BrandCard({ name, href, logo }: { name: string; href: string; logo: string | null }) {
  return (
    <a href={href} className="brand-card flex h-24 items-center justify-center rounded-xl border border-mist p-4 transition-colors hover:border-brand-500" title={name}>
      {logo ? <img src={logo} alt={name} className="brand-card-logo max-h-full max-w-full object-contain" /> : <span className="brand-card-name font-semibold text-ink">{name}</span>}
    </a>
  );
}
