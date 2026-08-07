import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { resolveRouteWith, type RouteLookupSource } from '../../src/lib/route-resolution.ts';
import type { Category, CmsPage, Product } from '../../src/lib/types/index.ts';

/**
 * Unit tests for the pure URL-resolution logic behind the [...path]
 * RouteDispatcher (src/lib/url-resolver.ts wires this to the real provider
 * + React cache()). Stub lookups, no provider/dataset loading required.
 */

function categoryFixture(path: string): Category {
  return { id: 1, parentId: null, level: 1, title: 'Category', slug: path.split('/').pop() ?? '', path };
}

function productFixture(slug: string, categoryPath: string): Product {
  return {
    id: 1,
    sku: 'SKU-1',
    slug,
    title: 'Product',
    shortDescription: null,
    description: null,
    categoryId: 1,
    categoryPath,
    brandId: null,
    brand: null,
    image: null,
    imageLarge: null,
    gallery: [],
    prices: [{ quantity: 1, amount: 10, currency: 'USD' }],
    attributes: [],
    variants: [],
    inStock: true,
    isFeatured: false,
    isNewArrival: false,
  };
}

function cmsPageFixture(slug: string): CmsPage {
  return { id: 1, title: 'Page', slug, content: '<p>content</p>' };
}

function stubSource(overrides: Partial<RouteLookupSource> = {}): RouteLookupSource & { calls: Record<string, unknown[]> } {
  const calls: Record<string, unknown[]> = { getCategoryByPath: [], getProductBySlug: [], getCmsPageBySlug: [] };
  return {
    calls,
    async getCategoryByPath(path) {
      calls.getCategoryByPath.push(path);
      return overrides.getCategoryByPath ? overrides.getCategoryByPath(path) : null;
    },
    async getProductBySlug(slug) {
      calls.getProductBySlug.push(slug);
      return overrides.getProductBySlug ? overrides.getProductBySlug(slug) : null;
    },
    async getCmsPageBySlug(slug) {
      calls.getCmsPageBySlug.push(slug);
      return overrides.getCmsPageBySlug ? overrides.getCmsPageBySlug(slug) : null;
    },
  };
}

describe('resolveRouteWith', () => {
  test('category path resolves to a category', async () => {
    const source = stubSource({ getCategoryByPath: async (path) => (path === 'medical/apparel' ? categoryFixture(path) : null) });
    const resolution = await resolveRouteWith(source, ['medical', 'apparel']);
    assert.equal(resolution.type, 'category');
    assert.equal(resolution.type === 'category' && resolution.category.path, 'medical/apparel');
  });

  test('category wins over a product whose slug collides with the category path', async () => {
    const source = stubSource({
      getCategoryByPath: async (path) => categoryFixture(path),
      getProductBySlug: async (slug) => productFixture(slug, ''),
    });
    const resolution = await resolveRouteWith(source, ['sale']);
    assert.equal(resolution.type, 'category');
  });

  test('product resolves at its exact canonical URL (category path prefix + slug)', async () => {
    const source = stubSource({
      getProductBySlug: async (slug) => (slug === 'driven-backpack' ? productFixture(slug, 'gear/bags') : null),
    });
    const resolution = await resolveRouteWith(source, ['gear', 'bags', 'driven-backpack']);
    assert.equal(resolution.type, 'product');
    assert.equal(resolution.type === 'product' && resolution.product.slug, 'driven-backpack');
  });

  test('product with a wrong category prefix is not-found (strict canonical, no fallback)', async () => {
    const source = stubSource({
      getProductBySlug: async (slug) => productFixture(slug, 'gear/bags'),
    });
    const resolution = await resolveRouteWith(source, ['wrong', 'prefix', 'driven-backpack']);
    assert.equal(resolution.type, 'not-found');
  });

  test('product with an empty categoryPath resolves at the bare single-segment URL', async () => {
    const source = stubSource({ getProductBySlug: async (slug) => productFixture(slug, '') });
    const resolution = await resolveRouteWith(source, ['driven-backpack']);
    assert.equal(resolution.type, 'product');
  });

  test('single-segment path resolves to a CMS page when nothing else matches', async () => {
    const source = stubSource({ getCmsPageBySlug: async (slug) => (slug === 'orders-and-returns' ? cmsPageFixture(slug) : null) });
    const resolution = await resolveRouteWith(source, ['orders-and-returns']);
    assert.equal(resolution.type, 'content');
    assert.equal(resolution.type === 'content' && resolution.page.slug, 'orders-and-returns');
  });

  test('CMS lookup is never attempted for multi-segment paths', async () => {
    const source = stubSource({ getCmsPageBySlug: async (slug) => cmsPageFixture(slug) });
    const resolution = await resolveRouteWith(source, ['some', 'nested', 'page']);
    assert.equal(resolution.type, 'not-found');
    assert.deepEqual(source.calls.getCmsPageBySlug, []);
  });

  test('nothing matching resolves to not-found', async () => {
    const source = stubSource();
    const resolution = await resolveRouteWith(source, ['does-not-exist']);
    assert.equal(resolution.type, 'not-found');
  });

  test('all lookups fire speculatively in parallel, before precedence is applied', async () => {
    // If lookups were sequential (as before this refactor), a category hit
    // would short-circuit the product lookup. Parallel-then-precedence means
    // the product lookup is always issued too.
    const source = stubSource({ getCategoryByPath: async (path) => categoryFixture(path) });
    await resolveRouteWith(source, ['medical']);
    assert.deepEqual(source.calls.getCategoryByPath, ['medical']);
    assert.deepEqual(source.calls.getProductBySlug, ['medical']);
    assert.deepEqual(source.calls.getCmsPageBySlug, ['medical']);
  });
});
