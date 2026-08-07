import type { ReactNode } from 'react';
import Breadcrumbs, { type Crumb } from './Breadcrumbs';

/** Breadcrumbs + `<h1>` (+ optional subtitle) — the pattern every listing/detail/CMS page repeated by hand. */
export default function PageHeader({ crumbs, title, subtitle }: { crumbs: Crumb[]; title: ReactNode; subtitle?: ReactNode }) {
  return (
    <>
      <Breadcrumbs crumbs={crumbs} />
      <h1 className={subtitle ? 'page-title mb-1 text-3xl font-bold' : 'page-title mb-6 text-3xl font-bold'}>{title}</h1>
      {subtitle && <p className="page-subtitle mb-6 text-sm text-gray-600">{subtitle}</p>}
    </>
  );
}
