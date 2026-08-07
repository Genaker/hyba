import Link from 'next/link';

export interface Crumb {
  label: string;
  href?: string;
}

export default function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="breadcrumbs py-3 text-sm text-gray-500">
      <ol className="breadcrumbs-list flex flex-wrap items-center gap-1">
        <li className="breadcrumb-item"><Link href="/" className="breadcrumb-link hover:text-brand-600">Home</Link></li>
        {crumbs.map((crumb, index) => (
          <li key={index} className="breadcrumb-item flex items-center gap-1">
            <span aria-hidden className="breadcrumb-separator">/</span>
            {crumb.href ? (
              <Link href={crumb.href} className="breadcrumb-link hover:text-brand-600">{crumb.label}</Link>
            ) : (
              <span aria-current="page" className="breadcrumb-current text-ink">{crumb.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
