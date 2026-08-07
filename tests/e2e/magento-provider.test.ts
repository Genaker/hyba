import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { chromium, type Browser, type Page } from 'playwright-core';
import { startTestServer, type TestServer } from './test-server.ts';

/**
 * Smoke-tests the second static provider (`raw-magento-data` — real Magento
 * Luma sample data, extracted via scripts/extract-magento-data.mjs, see
 * src/lib/provider/raw-magento-data.ts) through the same pages
 * `pages.test.ts` exercises against `raw-oro-data`, proving
 * `createStaticDataProvider` genuinely works with a different dataset, not
 * just the one it was extracted from.
 */
let server: TestServer;
let browser: Browser;

const desktopViewport = { width: 1440, height: 900 };

async function newPage(): Promise<Page> {
  return browser.newPage({ viewport: desktopViewport });
}

before(async () => {
  // No JS_MODE override — this fork's own zero-JS default (config.yaml) is the configuration
  // that matters here. The original storefront's version of this file forced JS_MODE=full for
  // React hydration; on this fork that would let React's hydration reconciliation run alongside
  // Alpine, fighting over the same DOM (React can replace subtrees Alpine already mutated —
  // x-cloak's inline style, x-bind:disabled, input values — detaching Alpine's reactive bindings
  // from them in the process).
  server = await startTestServer(3103, { DATA_PROVIDER: 'raw-magento-data' });
  browser = await chromium.launch({ args: ['--no-sandbox'] });
});

after(async () => {
  await browser.close();
  server.stop();
});

describe('homepage', () => {
  it("renders the real Luma top-level nav (What's New, Women, Men, Gear, Training, Sale)", async () => {
    const page = await newPage();
    await page.goto(`${server.baseUrl}/`, { waitUntil: 'networkidle' });

    for (const href of ['/what-is-new', '/women', '/men', '/gear', '/training', '/sale']) {
      assert.ok(await page.locator(`nav[aria-label="Catalog"] a[href="${href}"]`).count() > 0, `expected a nav link to ${href}`);
    }
    await page.close();
  });
});

describe('category page (/men)', () => {
  it('renders products, breadcrumbs, title and configurable-product facets (Color/Size)', async () => {
    const page = await newPage();
    await page.goto(`${server.baseUrl}/men`, { waitUntil: 'networkidle' });

    assert.ok(await page.locator('article').count() > 0, 'expected at least one product tile');
    assert.ok(await page.locator('nav[aria-label="Breadcrumb"]').isVisible());
    assert.ok(await page.getByRole('heading', { level: 1, name: 'Men' }).isVisible());
    assert.ok(await page.getByRole('heading', { name: 'Color' }).isVisible());
    assert.ok(await page.getByRole('heading', { name: 'Size' }).isVisible());

    // Faceting reads every configurable-product variant's color/size, not just one — a category
    // of configurable products should offer several distinct values, not a single option.
    const colorSection = page.locator('.filter-group', { has: page.getByRole('heading', { name: 'Color' }) });
    assert.ok((await colorSection.locator('li').count()) > 1, 'expected multiple Color facet options');
    await page.close();
  });
});

// Every selector below targets this fork's Alpine-based ConfigurablePanel
// (src/components/hyva/ConfigurablePanel.tsx) — the React ConfigurableProductPanel this file
// originally tested was removed on this fork in favor of Alpine islands (see the fork's
// implementation plan). `.product-info-content form.box-tocart` scopes to the PDP's own
// add-to-cart form (not a related-product tile's).
const pdpAddToCart = '.product-info-content form.box-tocart button[type="submit"]';

describe('configurable product page (/men/tops-men/hoodies-and-sweatshirts-men/marco-lightweight-active-hoodie)', () => {
  it('renders title, price and an enabled Add to Cart button', async () => {
    const page = await newPage();
    await page.goto(
      `${server.baseUrl}/men/tops-men/hoodies-and-sweatshirts-men/marco-lightweight-active-hoodie`,
      { waitUntil: 'networkidle' },
    );

    assert.ok(await page.getByRole('heading', { level: 1, name: 'Marco Lightweight Active Hoodie' }).isVisible());
    assert.match(await page.locator('body').innerText(), /\$74\.00/);
    assert.ok(await page.locator(pdpAddToCart).isVisible());
    await page.close();
  });
});

/** Selecting a swatch/button is an Alpine state update (initConfigurableOptions) — waits for
 * `allSelected` to actually flip on the underlying Alpine component (via the same `window.Alpine`
 * bootstrap.mjs exposes), rather than a fixed sleep, so this stays fast when the machine is idle
 * and doesn't flake under load. Add to Cart itself is never disabled on this fork (see the
 * "clicking before a full selection" tests), so a disabled-attribute wait wouldn't mean anything. */
async function waitForAddToCartEnabled(page: Page) {
  await page.waitForFunction(
    () => {
      const root = document.querySelector('.product-info-main');
      const data = root && (window as any).Alpine?.$data(root);
      return !!data?.allSelected;
    },
    { timeout: 10_000 },
  );
}

/** `waitUntil: 'networkidle'` tracks network activity, not Alpine's own (synchronous, but
 * script-execution-ordered) DOM processing — `x-for` template expansion in particular can still
 * be pending in the instant right after networkidle fires, especially on a loaded machine. Wait
 * for the ConfigurablePanel's own swatch buttons to have actually rendered before interacting. */
async function waitForConfigurableOptionsMounted(page: Page) {
  await page.waitForFunction(() => document.querySelectorAll('.swatch-option').length > 0, { timeout: 20_000 });
}

describe('configurable product variant selection (/men/tops-men/tees-men/balboa-persistence-tee)', () => {
  const productUrl = `/men/tops-men/tees-men/balboa-persistence-tee`;

  // Add to Cart stays clickable at all times on this fork — checked against the real Hyvä
  // demo's own behavior, which does the same rather than disabling the button outright — so
  // this checks the click-time validation message instead of a disabled attribute.
  it('clicking Add to Cart before Size and Color are chosen shows a validation message, not a submit', async () => {
    const page = await newPage();
    await page.goto(`${server.baseUrl}${productUrl}`, { waitUntil: 'networkidle' });
    await waitForConfigurableOptionsMounted(page);

    assert.equal(await page.locator('.product-option-message').isVisible(), false, 'no message until a click is actually attempted');
    await page.locator(pdpAddToCart).click();
    assert.match(await page.locator('.product-option-message').innerText(), /Please select Color and Size options\./);
    assert.equal(new URL(page.url()).search, '', 'the click must not have submitted the form');
    await page.close();
  });

  it('selecting Size + Color updates the SKU/image and enables Add to Cart', async () => {
    const page = await newPage();
    await page.goto(`${server.baseUrl}${productUrl}`, { waitUntil: 'networkidle' });
    await waitForConfigurableOptionsMounted(page);

    assert.equal((await page.locator('body').innerText()).match(/SKU:\s*(\S+)/)?.[1], 'MS03');
    const productImageBefore = await page.locator('main img, article img').first().getAttribute('src');

    // Color alone must already swap the image — regression: it used to wait for ALL axes.
    await page.locator('fieldset:has-text("Color") button', { hasText: 'Green' }).first().click();
    const productImageColorOnly = await page.locator('main img, article img').first().getAttribute('src');
    assert.notEqual(productImageColorOnly, productImageBefore, 'expected the image to swap on Color alone, before Size is chosen');

    await page.locator('fieldset:has-text("Size") button', { hasText: 'M' }).first().click();
    await waitForAddToCartEnabled(page);

    assert.equal((await page.locator('body').innerText()).match(/SKU:\s*(\S+)/)?.[1], 'MS03-M-Green');
    const productImageAfter = await page.locator('main img, article img').first().getAttribute('src');
    assert.notEqual(productImageAfter, productImageBefore, 'expected the product image to swap to the selected variant');
    await page.close();
  });

  it('selecting Size + Color mirrors the choice into the URL as slugified query params', async () => {
    const page = await newPage();
    await page.goto(`${server.baseUrl}${productUrl}`, { waitUntil: 'networkidle' });
    await waitForConfigurableOptionsMounted(page);
    assert.equal(new URL(page.url()).search, '', 'no options chosen yet — no query string');

    await page.locator('fieldset:has-text("Color") button', { hasText: 'Green' }).first().click();
    await page.waitForFunction(() => location.search.includes('color=Green'));
    assert.equal(new URL(page.url()).searchParams.get('size'), null, 'Size not chosen yet — no size param');

    await page.locator('fieldset:has-text("Size") button', { hasText: 'M' }).first().click();
    await page.waitForFunction(() => location.search.includes('size=M'));

    const params = new URL(page.url()).searchParams;
    assert.equal(params.get('color'), 'Green');
    assert.equal(params.get('size'), 'M');
    await page.close();
  });

  it('replaces history per swatch click rather than pushing — one Back leaves the product page entirely', async () => {
    const page = await newPage();
    await page.goto(`${server.baseUrl}/`, { waitUntil: 'networkidle' });
    await page.goto(`${server.baseUrl}${productUrl}`, { waitUntil: 'networkidle' });
    await waitForConfigurableOptionsMounted(page);

    await page.locator('fieldset:has-text("Color") button', { hasText: 'Green' }).first().click();
    await page.waitForFunction(() => location.search.includes('color=Green'));
    await page.locator('fieldset:has-text("Size") button', { hasText: 'M' }).first().click();
    await page.waitForFunction(() => location.search.includes('size=M'));

    await page.goBack({ waitUntil: 'networkidle' });
    assert.equal(page.url(), `${server.baseUrl}/`, 'a single Back should skip past both swatch picks straight to the previous page — router.replace(), not push()');
    await page.close();
  });

  it('loading the page with ?color=&size= in the URL pre-selects that variant with zero clicks (bookmark/copy-paste)', async () => {
    const page = await newPage();
    await page.goto(`${server.baseUrl}${productUrl}?color=Green&size=M`, { waitUntil: 'networkidle' });

    assert.equal((await page.locator('body').innerText()).match(/SKU:\s*(\S+)/)?.[1], 'MS03-M-Green');
    // Add to Cart is always clickable on this fork (see the "clicking before a full selection"
    // test above) — the real signal that preselection worked is that clicking it succeeds with
    // no validation message, not a disabled/enabled attribute.
    await page.locator('.product-info-content form.box-tocart button[type="submit"]').click();
    assert.equal(await page.locator('.product-option-message').isVisible(), false, 'preselection from the URL should already be a complete, valid selection');
    assert.equal(
      await page.locator('fieldset:has-text("Color") button[aria-pressed="true"]', { hasText: 'Green' }).count(),
      1,
      'Color swatch from the URL should render pre-selected',
    );
    assert.equal(
      await page.locator('fieldset:has-text("Size") button[aria-pressed="true"]', { hasText: 'M' }).count(),
      1,
      'Size swatch from the URL should render pre-selected',
    );
    await page.close();
  });

  it('an unrecognized option value in the URL is ignored rather than crashing the page', async () => {
    const page = await newPage();
    const response = await page.goto(`${server.baseUrl}${productUrl}?color=Nonexistent-Color&size=M`, { waitUntil: 'networkidle' });
    assert.equal(response?.status(), 200);
    await waitForConfigurableOptionsMounted(page);
    // Color never actually got selected, so a click attempt should still be blocked with a
    // validation message (the button itself stays clickable regardless — see the test above).
    await page.locator(pdpAddToCart).click();
    assert.match(await page.locator('.product-option-message').innerText(), /Please select Color/);
    assert.equal(
      await page.locator('fieldset:has-text("Size") button[aria-pressed="true"]', { hasText: 'M' }).count(),
      1,
      'Size, a valid param on the same URL, should still take effect independently of the bad Color value',
    );
    await page.close();
  });

  it('adds the selected variant SKU to the cart and cart drawer, with Size/Color shown on both', async () => {
    const page = await newPage();
    await page.goto(`${server.baseUrl}${productUrl}`, { waitUntil: 'networkidle' });
    await waitForConfigurableOptionsMounted(page);

    await page.locator('fieldset:has-text("Size") button', { hasText: 'L' }).first().click();
    await page.locator('fieldset:has-text("Color") button', { hasText: 'Orange' }).first().click();
    await waitForAddToCartEnabled(page);

    // Add-to-cart is a fetch intercept on this fork (initAddToCartForm): POST /api/cart/add,
    // then a SECOND round trip — dispatch('reload-customer-section-data') makes bootstrap.mjs
    // re-fetch GET /api/customer-sections (which itself resolves every cart line's product +
    // variant options against the gateway), and only THAT response's private-content-loaded
    // event is what the drawer actually re-renders from. Wait for both responses explicitly
    // (generous timeout — a cold-started gateway's first cart-touching request in the whole
    // suite can be slow) so a real backend failure surfaces as a status-code assertion instead
    // of a generic UI timeout.
    const [cartAddResponse] = await Promise.all([
      page.waitForResponse((response) => response.url().includes('/api/cart/add'), { timeout: 45_000 }),
      page.locator('.product-info-content form.box-tocart button[type="submit"]').click(),
    ]);
    assert.equal(cartAddResponse.status(), 200, 'expected /api/cart/add to succeed');
    const sectionsResponse = await page.waitForResponse((response) => response.url().includes('/api/customer-sections'), { timeout: 45_000 });
    assert.equal(sectionsResponse.status(), 200, 'expected the follow-up /api/customer-sections refresh to succeed');
    const drawerLine = page.locator('.cart-drawer-item', { hasText: 'Balboa Persistence Tee' });
    await drawerLine.waitFor({ state: 'visible', timeout: 20_000 });
    const drawerText = await drawerLine.innerText();
    assert.match(drawerText, /Color: Orange, Size: L/);
    // The drawer's "back to product" link must carry the exact variant added — Color before
    // Size, matching the axis order buildConfigurablePanelData derives from the product's variants.
    assert.equal(await drawerLine.locator('.cart-drawer-item-name').getAttribute('href'), `${productUrl}?color=Orange&size=L`);

    const cartResponse = await page.goto(`${server.baseUrl}/cart`, { waitUntil: 'networkidle' });
    assert.equal(cartResponse?.status(), 200);
    const cartText = await page.locator('body').innerText();
    assert.match(cartText, /MS03-L-Orange/);
    assert.match(cartText, /See Details/);
    assert.match(cartText, /Color:\s*Orange/);
    assert.match(cartText, /Size:\s*L/);
    assert.equal(await page.locator('.cart-item-name').getAttribute('href'), `${productUrl}?color=Orange&size=L`);
    await page.close();
  });

  it('clicking a cart line\'s product link returns to the exact variant that was added, pre-selected', async () => {
    const page = await newPage();
    await page.goto(`${server.baseUrl}${productUrl}`, { waitUntil: 'networkidle' });
    await waitForConfigurableOptionsMounted(page);

    // Exact match, not substring — plain hasText: 'S' also matches "XS", which sorts first in
    // the DOM, so `.first()` would silently pick the wrong size.
    await page.locator('fieldset:has-text("Size") button', { hasText: /^S$/ }).first().click();
    await page.locator('fieldset:has-text("Color") button', { hasText: 'Green' }).first().click();
    await waitForAddToCartEnabled(page);

    // Add-to-cart is a fetch intercept on this fork — no navigation happens, so wait for its own
    // observable effect (the drawer opening) rather than a load-state event that fetch doesn't
    // participate in the same way a real redirect would.
    await page.locator('.product-info-content form.box-tocart button[type="submit"]').click();
    await page.locator('.cart-drawer-panel').waitFor({ state: 'visible', timeout: 20_000 });

    // /cart is a genuine, separate navigation — its own networkidle is reliable here.
    await page.goto(`${server.baseUrl}/cart`, { waitUntil: 'networkidle' });
    await Promise.all([page.waitForURL(/color=Green&size=S/), page.locator('.cart-item-name').click()]);

    assert.equal((await page.locator('body').innerText()).match(/SKU:\s*(\S+)/)?.[1], 'MS03-S-Green');
    // Add to Cart is always clickable on this fork — the real signal that the returned-to page
    // already has both axes pre-selected is that clicking it succeeds with no validation message.
    await page.locator('.product-info-content form.box-tocart button[type="submit"]').click();
    assert.equal(await page.locator('.product-option-message').isVisible(), false, 'the returned-to product page should already have both axes pre-selected');
    await page.close();
  });

  // Regression: OrderItem.selectedOptions — placed orders used to drop which variant was bought.
  it('guest checkout carries the selected variant through to the order confirmation', async () => {
    const page = await newPage();
    await page.goto(`${server.baseUrl}${productUrl}`, { waitUntil: 'networkidle' });
    await waitForConfigurableOptionsMounted(page);

    await page.locator('fieldset:has-text("Size") button', { hasText: 'M' }).first().click();
    await page.locator('fieldset:has-text("Color") button', { hasText: 'Green' }).first().click();
    await waitForAddToCartEnabled(page);
    await page.locator('.product-info-content form.box-tocart button[type="submit"]').click();
    await page.locator('.cart-drawer-panel').waitFor({ state: 'visible', timeout: 20_000 });

    await page.goto(`${server.baseUrl}/checkout`, { waitUntil: 'networkidle' });
    await page.fill('input[name="email"]', 'guest-e2e@example.org');
    await page.fill('input[name="firstName"]', 'Guest');
    await page.fill('input[name="street"]', '1 Test St');
    await page.fill('input[name="city"]', 'Springfield');
    await Promise.all([page.waitForURL(/checkout\/confirmation/), page.locator('button[type="submit"]', { hasText: /place order/i }).click()]);

    const confirmationText = await page.locator('body').innerText();
    assert.match(confirmationText, /Balboa Persistence Tee/);
    assert.match(confirmationText, /Color: Green, Size: M/);
    await page.close();
  });
});

describe('GET /api/sku-search', () => {
  async function search(query: string): Promise<{ sku: string; name: string; price: number | null; url: string; image: string | null; matchType?: string }[]> {
    const response = await fetch(`${server.baseUrl}/api/sku-search?q=${encodeURIComponent(query)}`);
    assert.equal(response.status, 200);
    return response.json();
  }

  it('matches a parent SKU with name, price, and product url/image (header autocomplete)', async () => {
    const results = await search('WSH12');
    assert.deepEqual(results[0], {
      sku: 'WSH12',
      name: 'Erika Running Short',
      price: 45,
      url: '/women/bottoms-women/shorts-women/erika-running-short',
      image: '/media/magento/products/wsh12.jpg',
      matchType: 'text',
    });
  });

  it('matches by product name too', async () => {
    const results = await search('trek jacket');
    assert.ok(results.some((result) => result.name === 'Adrienne Trek Jacket'), 'expected a name match');
  });

  it('matches configurable-variant SKUs, priced from the variant', async () => {
    const results = await search('WSH12-28-Green');
    assert.equal(results[0]?.sku, 'WSH12-28-Green');
    assert.equal(results[0]?.name, 'Erika Running Short');
    assert.equal(typeof results[0]?.price, 'number');
  });

  it('returns [] under 2 chars; unknown SKUs yield only semantic suggestions (or nothing)', async () => {
    assert.deepEqual(await search('W'), []);
    // with embeddings indexed, a typo'd SKU may still surface similar products —
    // but never as literal text matches
    const unknownResults = await search('NO-SUCH-SKU-999');
    assert.ok(unknownResults.every((result) => result.matchType === 'semantic'), 'no text matches for an unknown SKU');
  });

  it('caps results at 8', async () => {
    // 'ws' matches many SKUs/names in this dataset
    const results = await search('ws');
    assert.ok(results.length <= 8, `expected at most 8, got ${results.length}`);
  });
});

describe('quick order SKU typeahead', () => {
  it('typing a partial SKU shows sku — name — price suggestions; clicking fills the input', async () => {
    const page = await newPage();
    await page.goto(`${server.baseUrl}/quick-order`, { waitUntil: 'networkidle' });

    await page.fill('input[name="sku_1"]', 'WSH12');
    await page.waitForSelector('.sku-suggestions:not([hidden]) .sku-suggestion-button', { timeout: 5000 });
    const suggestion = await page.locator('.sku-suggestion-button').first().textContent();
    assert.match(suggestion ?? '', /WSH12 — Erika Running Short — \$45\.00/);

    await page.locator('.sku-suggestion-button').first().click();
    assert.equal(await page.inputValue('input[name="sku_1"]'), 'WSH12');
    assert.equal(await page.locator('.sku-suggestions:not([hidden])').count(), 0, 'dropdown closes after picking');
    await page.close();
  });
});

describe('search page', () => {
  it('finds the one product matching a distinctive name fragment', async () => {
    const page = await newPage();
    await page.goto(`${server.baseUrl}/product/search?search=marco`, { waitUntil: 'networkidle' });

    assert.match(await page.locator('body').innerText(), /1 item found/);
    assert.ok(await page.locator('article').count() === 1);
    await page.close();
  });
});

describe('CMS pages', () => {
  for (const [path, title] of [
    ['/about', 'About us'],
    ['/customer-service', 'Customer Service'],
    ['/shipping-and-returns', 'Shipping & Returns'],
    ['/orders-and-returns', 'Orders & Returns'],
    ['/international-shipping', 'International Shipping'],
    ['/secure-shopping', 'Secure Shopping'],
    ['/privacy-policy', 'Privacy Policy'],
  ] as const) {
    it(`${path} (linked from the footer) resolves and renders its title`, async () => {
      const page = await newPage();
      const response = await page.goto(`${server.baseUrl}${path}`, { waitUntil: 'networkidle' });
      assert.equal(response?.status(), 200, `expected ${path} to resolve — the footer links to it unconditionally`);
      assert.ok(await page.getByRole('heading', { level: 1, name: title }).isVisible());
      await page.close();
    });
  }
});

describe('sale category', () => {
  it('renders with no products — this Luma sample install genuinely has none in Sale', async () => {
    const page = await newPage();
    const response = await page.goto(`${server.baseUrl}/sale`, { waitUntil: 'networkidle' });
    assert.equal(response?.status(), 200);
    assert.ok(await page.getByRole('heading', { level: 1, name: 'Sale' }).isVisible());
    assert.equal(await page.locator('article').count(), 0);
    await page.close();
  });
});

// Configurable products render through ConfigurablePanel's own Alpine-driven gallery
// (src/components/hyva/ConfigurablePanel.tsx: one reactive <img>, no CSS-radio slides), not the
// CSS-only ProductGallery.tsx this file originally tested here — that component still backs the
// SIMPLE (non-configurable) product path unchanged, see the gallery describe block below.
describe('configurable product gallery (Magento Luma parity)', () => {
  const heroHoodie = '/men/tops-men/hoodies-and-sweatshirts-men/hero-hoodie';

  it('shows the product\'s own gallery and switches the main image on thumbnail click', async () => {
    const page = await newPage();
    await page.goto(`${server.baseUrl}${heroHoodie}`, { waitUntil: 'networkidle' });
    // `.configurable-gallery-thumb` renders from `x-for="... in gallery"`, and `gallery` is a
    // GETTER (derived from activeVariant/product) — a different Alpine reactivity timing than
    // the plain `axes` array backing `.swatch-option`, so waiting for swatches to exist doesn't
    // reliably imply the gallery's own x-for has flushed too. Wait for the thumb count itself.
    await page.waitForFunction(() => document.querySelectorAll('.configurable-gallery-thumb').length === 3, { timeout: 20_000 });

    assert.equal(await page.locator('.configurable-gallery-thumb').count(), 3, 'MH07 ships three own shots');
    const mainSrcBefore = await page.locator('.configurable-gallery-main').getAttribute('src');

    await page.locator('.configurable-gallery-thumb').nth(2).click();
    await page.waitForFunction(
      (before) => document.querySelector('.configurable-gallery-main')?.getAttribute('src') !== before,
      mainSrcBefore,
      { timeout: 5000 },
    );
    await page.close();
  });

  /**
   * Magento's Luma rule, verified against a real Luma PDP: selecting a variant
   * PREPENDS that variant's shots to the product gallery rather than replacing
   * it — so a colour with one image still shows the product's other views.
   */
  it('prepends the selected variant\'s shots to the product gallery', async () => {
    const page = await newPage();
    await page.goto(`${server.baseUrl}${heroHoodie}`, { waitUntil: 'networkidle' });
    await waitForConfigurableOptionsMounted(page);
    const thumbCount = () => page.locator('.configurable-gallery-thumb').count();
    assert.equal(await thumbCount(), 3);

    // Black has a single shot in Luma's data → 1 variant + 3 product shots
    await page.locator('fieldset:has-text("Color") button', { hasText: 'Black' }).first().click();
    await page.waitForFunction(() => document.querySelectorAll('.configurable-gallery-thumb').length === 4, { timeout: 5000 });

    // Gray ships alt/back views → 3 variant + 3 product shots
    await page.locator('fieldset:has-text("Color") button', { hasText: 'Gray' }).first().click();
    await page.waitForFunction(() => document.querySelectorAll('.configurable-gallery-thumb').length === 6, { timeout: 5000 });
    await page.close();
  });
});

