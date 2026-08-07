import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, type TestServer } from '../e2e/test-server.ts';

/**
 * Verifies `oroApiProvider` (src/lib/provider/oro/) against a *real* running
 * OroCommerce instance — not mocks. Boots the actual server.mjs with
 * DATA_PROVIDER=oro and drives it through the /api/test/oro-provider dispatch
 * route (see that file for why a plain `node --test` import isn't possible).
 *
 * Requires ORO_API_BASE_URL, ORO_API_CLIENT_ID, ORO_API_CLIENT_SECRET in the
 * environment (see README "Going live against Oro" for how to provision the
 * OAuth2 client). Skips entirely — not a failure — when they're absent, same
 * spirit as the INTEGRATION_TESTS_ENABLED gate used on the PHP side of this
 * project family.
 *
 * The specific SKUs/slugs/prices asserted below come from OroCommerce's
 * stock demo dataset (`oro:sandbox:install --sample-data`) — if you're
 * running against a differently-seeded instance, the structural assertions
 * (shape, invariants) will still hold but the exact-value ones will not.
 */

const oroConfigured = Boolean(process.env.ORO_API_BASE_URL && process.env.ORO_API_CLIENT_ID && process.env.ORO_API_CLIENT_SECRET);

describe('oroApiProvider (live Oro integration)', { skip: !oroConfigured && 'ORO_API_BASE_URL/CLIENT_ID/CLIENT_SECRET not set — skipping live Oro integration tests' }, () => {
  let server: TestServer;

  before(async () => {
    server = await startTestServer(4100, { DATA_PROVIDER: 'oro' });
  });

  after(() => {
    server?.stop();
  });

  async function call(action: string, params: Record<string, string> = {}) {
    const url = new URL(`${server.baseUrl}/api/test/oro-provider`);
    url.searchParams.set('action', action);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    const response = await fetch(url);
    if (response.status !== 200) {
      throw new Error(`${action} ${JSON.stringify(params)} → HTTP ${response.status}: ${await response.text()}`);
    }
    return response.json();
  }

  test('getCategories: returns a well-formed tree rooted at level 0', async () => {
    const categories = await call('categories');
    assert.ok(Array.isArray(categories) && categories.length > 0, 'expected at least one category');

    const roots = categories.filter((category: any) => category.level === 0);
    assert.equal(roots.length, 1, 'expected exactly one level-0 (root) category');
    assert.equal(roots[0].path, '', 'root category path should be empty');
    assert.equal(roots[0].parentId, null);

    for (const category of categories) {
      if (category.level === 0) continue;
      assert.ok(category.parentId !== null, `${category.title} (level ${category.level}) should have a parentId`);
      assert.ok(category.path.length > 0, `${category.title} should have a non-empty path`);
      assert.ok(category.path.split('/').length === category.level, `${category.title}: path depth should equal level`);
    }

    const lighting = categories.find((category: any) => category.slug === 'lighting-products');
    assert.ok(lighting, 'expected the "Lighting Products" demo category to exist');
    assert.equal(lighting.level, 1);
    assert.equal(lighting.path, 'lighting-products');
  });

  test('getCategoryByPath: resolves a known nested category', async () => {
    const category = await call('category', { path: 'lighting-products/headlamps' });
    assert.ok(category, 'expected lighting-products/headlamps to resolve');
    assert.equal(category.title, 'Headlamps');
    assert.equal(category.level, 2);
    assert.equal(category.parentId, (await call('category', { path: 'lighting-products' })).id);
  });

  test('getCategoryByPath: unknown path resolves to null', async () => {
    assert.equal(await call('category', { path: 'does-not-exist' }), null);
  });

  test('getProductBySku: maps a known demo product with real field values', async () => {
    const product = await call('product-by-sku', { sku: '0RT28' });
    assert.ok(product, 'expected SKU 0RT28 to exist in the demo catalog');
    assert.equal(product.sku, '0RT28');
    assert.equal(product.title, '220 Lumen Rechargeable Headlamp');
    assert.equal(product.inStock, false, 'this demo SKU is seeded as out_of_stock');

    assert.ok(product.prices.length >= 1, 'expected tiered pricing');
    assert.equal(product.prices[0].quantity, 1);
    assert.equal(product.prices[0].amount, 79.99);
    assert.equal(product.prices[0].currency, 'USD');
    for (let i = 1; i < product.prices.length; i++) {
      assert.ok(product.prices[i].quantity > product.prices[i - 1].quantity, 'price tiers should be sorted ascending by quantity');
    }

    assert.ok(product.attributes.length > 0, 'expected the description-embedded attribute groups to be extracted');
    const featureGroup = product.attributes.find((group: any) => group.family === 'Product Information & Features');
    assert.ok(featureGroup, 'expected a "Product Information & Features" attribute group');
    assert.ok(
      featureGroup.attributes.some((attribute: any) => attribute.label === 'Catalog Page' && attribute.value === '9927'),
      'expected the "Catalog Page: 9927" bullet to be parsed out of the description',
    );
    assert.ok(!product.description.includes('product-view-desc-list'), 'attribute bullet markup should be stripped from the cleaned description');

    assert.ok(product.image?.startsWith('/media/cache/attachment/filter/'), `unexpected image url: ${product.image}`);
    assert.ok(product.imageLarge?.startsWith('/media/cache/attachment/filter/'), `unexpected imageLarge url: ${product.imageLarge}`);

    // Brand isn't exposed by the frontend API at all — this comes from withFallback() enriching
    // against the extracted snapshot (../gateway/data/products.json), not a live Oro field.
    assert.equal(product.brandId, 1);
    assert.equal(product.brand, 'ACME');
  });

  test('getProductBySku: unknown SKU resolves to null', async () => {
    assert.equal(await call('product-by-sku', { sku: 'DOES-NOT-EXIST-XYZ' }), null);
  });

  test('getProductBySlug: resolves via Oro\'s route resolver to the same product as getProductBySku', async () => {
    const bySlug = await call('product-by-slug', { slug: '220-lumen-rechargeable-headlamp' });
    const bySku = await call('product-by-sku', { sku: '0RT28' });
    assert.ok(bySlug);
    assert.equal(bySlug.sku, bySku.sku);
    assert.equal(bySlug.id, bySku.id);
  });

  test('getProductBySlug: unknown slug resolves to null (not a thrown error)', async () => {
    assert.equal(await call('product-by-slug', { slug: 'not-a-real-product-slug' }), null);
  });

  test('getProducts: category listing is scoped to the subtree, with consistent paging and facets', async () => {
    const result = await call('products', { categoryPath: 'lighting-products/headlamps', pageSize: '5' });
    assert.ok(result.total > 0, 'expected at least one product under lighting-products/headlamps');
    assert.equal(result.page, 1);
    assert.equal(result.pageSize, 5);
    assert.equal(result.totalPages, Math.max(1, Math.ceil(result.total / 5)));
    assert.ok(result.items.length <= 5);

    for (const item of result.items) {
      assert.ok(
        item.categoryPath === 'lighting-products/headlamps' || item.categoryPath.startsWith('lighting-products/headlamps/'),
        `product "${item.title}" has categoryPath "${item.categoryPath}", expected it under lighting-products/headlamps`,
      );
    }

    assert.ok(result.facets.priceMin <= result.facets.priceMax);
  });

  test('getProducts: withFallback() merges in Brand and Featured facet groups Oro cannot compute live', async () => {
    const result = await call('products', { categoryPath: 'lighting-products/headlamps' });
    const brandGroup = result.facets.groups.find((group: any) => group.key === 'brand');
    assert.ok(brandGroup, 'expected a "brand" facet group merged in from the raw provider');
    assert.ok(brandGroup.options.some((option: any) => option.label === 'ACME' && option.count > 0));
  });

  test('getProducts: full-text search returns only matching products', async () => {
    const result = await call('products', { search: 'headlamp' });
    assert.ok(result.total > 0, 'expected at least one product matching "headlamp"');
    for (const item of result.items) {
      const haystack = `${item.sku} ${item.title} ${item.shortDescription ?? ''}`.toLowerCase();
      assert.ok(haystack.includes('headlamp'), `"${item.title}" doesn't actually contain "headlamp"`);
    }
  });

  test('getRelatedProducts: excludes the source product and stays within its category', async () => {
    const related = await call('related', { sku: '0RT28', limit: '4' });
    assert.ok(Array.isArray(related));
    assert.ok(related.length <= 4);
    assert.ok(related.every((item: any) => item.sku !== '0RT28'), 'related products should not include the source product');
  });

  test('getCmsPageBySlug: resolves the demo "About" page with real HTML content', async () => {
    const page = await call('cms', { slug: 'about' });
    assert.ok(page, 'expected the demo "About" CMS page to exist');
    assert.equal(page.title, 'About');
    assert.equal(page.slug, 'about');
    assert.ok(page.content.length > 0);
  });

  test('getCmsPageBySlug: unknown slug resolves to null', async () => {
    assert.equal(await call('cms', { slug: 'not-a-real-page' }), null);
  });

  test('getMenu: top-level nav mirrors live categories, "By Brand" spliced back in via withFallback()', async () => {
    const menu = await call('menu');
    const categories = await call('categories');
    const topCategoryCount = categories.filter((category: any) => category.level === 1).length;

    // +2: "New Arrivals" (built by the oro provider itself) and "By Brand" (Brand has no live
    // equivalent at all — withFallback() splices it in from the raw provider's own getMenu()).
    assert.equal(menu.length, topCategoryCount + 2);
    const brandColumn = menu.find((item: any) => item.title === 'By Brand');
    assert.ok(brandColumn, 'expected withFallback() to splice the "By Brand" column back in');
    assert.ok(brandColumn.children.length > 0);

    const liveCategory = menu.find((item: any) => item.title !== 'By Brand' && item.title !== 'New Arrivals');
    assert.ok(liveCategory.image, 'expected withFallback() to fill in the promo image the oro provider itself leaves null');
  });

  test('getSlides: no live source exists at all — withFallback() serves the extracted snapshot', async () => {
    const slides = await call('slides');
    assert.ok(slides.length > 0, 'expected withFallback() to serve slides.json since the oro provider itself always returns []');
  });

  test('findUser/getUserByEmail: the oro provider always throws — withFallback() delegates to the raw demo login instead of surfacing that', async () => {
    const user = await call('login', { email: 'AmandaRCole@example.org', password: 'demo123' });
    assert.ok(user, 'expected the demo credentials to authenticate via the raw provider fallback');
    assert.equal(user.email, 'AmandaRCole@example.org');

    assert.equal(await call('login', { email: 'AmandaRCole@example.org', password: 'wrong-password' }), null);

    const byEmail = await call('user-by-email', { email: 'AmandaRCole@example.org' });
    assert.ok(byEmail);
    assert.equal(byEmail.email, 'AmandaRCole@example.org');
  });
});
