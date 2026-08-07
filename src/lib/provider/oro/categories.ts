import type { Category } from '../../types';
import { oroApiGet, type JsonApiResource } from './client';
import { slugify } from './attributes';

function mapCategory(resource: JsonApiResource): Category {
  const url: string | null = resource.attributes.url;
  const path = url ? url.replace(/^\//, '') : '';

  const ancestors = resource.relationships?.categoryPath?.data;
  const ancestorIds = Array.isArray(ancestors) ? ancestors.map((ref) => Number(ref.id)) : [];
  const level = ancestorIds.length;
  const parentId = level > 0 ? ancestorIds[level - 1] : null;

  const slug = path ? path.split('/').pop()! : slugify(resource.attributes.title);

  return {
    id: Number(resource.id),
    parentId,
    level,
    title: resource.attributes.title,
    slug,
    path,
  };
}

/**
 * The full category tree, fetched once per revalidation window (see the `next:
 * {revalidate}` on oroApiGet — Next.js dedupes/caches this fetch across the
 * request). `mastercatalogcategories` is small (tens of rows for a normal
 * catalog) so a single unpaginated pull is fine; if a catalog has more than a
 * page's worth, follow `links.next` the same way getProducts does.
 */
export async function fetchCategories(): Promise<Category[]> {
  const categories: Category[] = [];
  let path: string | null = '/api/mastercatalogcategories';
  let searchParams: Record<string, string> | undefined = { 'page[size]': '100' };

  while (path) {
    const document = await oroApiGet(path, searchParams);
    const items = Array.isArray(document.data) ? document.data : [document.data];
    categories.push(...items.map(mapCategory));

    const next = document.links?.next ?? null;
    path = next ? new URL(next).pathname : null;
    searchParams = next ? Object.fromEntries(new URL(next).searchParams) : undefined;
  }

  return categories;
}

/** All category ids in the subtree rooted at `categoryPath` (inclusive) — used to scope product queries. */
export function subtreeCategoryIds(categories: Category[], categoryPath: string): number[] {
  return categories
    .filter((category) => category.path === categoryPath || category.path.startsWith(`${categoryPath}/`))
    .map((category) => category.id);
}
