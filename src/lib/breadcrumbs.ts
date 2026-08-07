import { provider } from './provider';
import type { Category } from './types';
import type { Crumb } from '@/components/Breadcrumbs';
import { categoryUrl } from '@/lib/urls';

/** Ancestor chain for a category, root-first, current page left unlinked. */
export async function categoryCrumbs(category: Category): Promise<Crumb[]> {
  const categories = await provider.getCategories();
  const crumbs: Crumb[] = [];
  let cursor: Category | undefined = category;
  while (cursor && cursor.parentId) {
    crumbs.unshift({ label: cursor.title, href: categoryUrl(cursor) });
    cursor = categories.find((candidate) => candidate.id === cursor!.parentId);
  }
  if (crumbs.length) crumbs[crumbs.length - 1].href = undefined;
  return crumbs;
}
