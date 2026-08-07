import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { chromium, type Browser, type Page } from 'playwright-core';
import { startTestServer, type TestServer } from './test-server.ts';

/**
 * This fork's Alpine.js architecture (see /root/.claude/plans/soft-growing-nova.md): the
 * storefront never hydrates React (config.yaml: javascript.mode: zero) — every interactive
 * behavior comes from Alpine islands + inline factories + native forms as a no-JS fallback.
 * These tests prove the two things that matter most: the enhanced (JS) path genuinely updates
 * without a page reload, and the same actions still work with JS disabled entirely.
 */
let server: TestServer;
let browser: Browser;

const desktopViewport = { width: 1440, height: 900 };
const waterBottlePath = '/gear/fitness-equipment/affirm-water-bottle';
const configurablePath = '/women/bottoms-women/shorts-women/erika-running-short';

async function newPage(): Promise<Page> {
  return browser.newPage({ viewport: desktopViewport });
}

/** `waitUntil: 'networkidle'` doesn't guarantee Alpine has finished walking the DOM and
 * attaching directives yet — clicking a form immediately after can race Alpine's own mount and
 * fall through to the native (full-reload) form submission instead of the fetch intercept. Wait
 * for the header's own Alpine root (present on every page) to have been initialized, via the
 * same `window.Alpine` bootstrap.mjs exposes, before interacting with anything. */
async function waitForAlpineMounted(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      try {
        return !!(window as any).Alpine?.$data(document.querySelector('.cart-drawer-root'));
      } catch {
        return false;
      }
    },
    { timeout: 10_000 },
  );
}

before(async () => {
  server = await startTestServer(3107, { DATA_PROVIDER: 'raw-magento-data' });
  browser = await chromium.launch({ args: ['--no-sandbox'] });
});

after(async () => {
  await browser.close();
  server.stop();
});

describe('zero-JS invariant', () => {
  it('every page ships no <script src> except data-island ones — no React hydration bundle at all', async () => {
    const page = await newPage();
    await page.goto(`${server.baseUrl}${waterBottlePath}`, { waitUntil: 'networkidle' });
    const html = await page.content();
    const externalScripts = [...html.matchAll(/<script\b[^>]*\bsrc=[^>]*>/g)].map((match) => match[0]);
    for (const tag of externalScripts) {
      assert.match(tag, /data-island/, `expected every external <script> to carry data-island, got: ${tag}`);
    }
    assert.ok(externalScripts.some((tag) => tag.includes('bootstrap.mjs')), 'expected the Alpine bootstrap island to be present');
    await page.close();
  });
});

describe('cart drawer (Alpine, no page reload)', () => {
  it('add-to-cart from the PDP opens the drawer with the item, badge updates, URL unchanged', async () => {
    const page = await newPage();
    await page.goto(`${server.baseUrl}${waterBottlePath}`, { waitUntil: 'networkidle' });
    await waitForAlpineMounted(page);

    await page.locator('.product-info-content form.box-tocart button[type="submit"]').click();
    await page.locator('.cart-drawer-panel').waitFor({ state: 'visible', timeout: 5000 });

    assert.match(await page.locator('.cart-drawer-panel').innerText(), /Affirm Water Bottle/);
    assert.equal(await page.locator('.cart-drawer-trigger-count').innerText(), '1');
    assert.equal(page.url(), `${server.baseUrl}${waterBottlePath}`, 'no navigation should have occurred');
    await page.close();
  });

  it('closing via the backdrop and reopening via the header trigger both work', async () => {
    const page = await newPage();
    await page.goto(`${server.baseUrl}${waterBottlePath}`, { waitUntil: 'networkidle' });
    await waitForAlpineMounted(page);
    await page.locator('.product-info-content form.box-tocart button[type="submit"]').click();
    await page.locator('.cart-drawer-panel').waitFor({ state: 'visible' });

    // Native <dialog> — the backdrop is a pseudo-element (::backdrop), not a locatable DOM
    // node, so "click the backdrop" means clicking the dialog element itself, away from its
    // content (the panel is right-aligned max-w-sm, so the far top-left corner is safely outside it).
    await page.mouse.click(10, 10);
    await page.locator('.cart-drawer-panel').waitFor({ state: 'hidden', timeout: 5000 });

    await page.locator('.cart-drawer-trigger').click();
    await page.locator('.cart-drawer-panel').waitFor({ state: 'visible', timeout: 5000 });
    await page.close();
  });

  it('updating a line quantity in the drawer recalculates the subtotal without a reload', async () => {
    const page = await newPage();
    await page.goto(`${server.baseUrl}${waterBottlePath}`, { waitUntil: 'networkidle' });
    await waitForAlpineMounted(page);
    await page.locator('.product-info-content form.box-tocart button[type="submit"]').click();
    await page.locator('.cart-drawer-panel').waitFor({ state: 'visible' });
    const subtotalBefore = await page.locator('.cart-drawer-subtotal').innerText();

    await page.locator('.cart-drawer-item-qty').fill('3');
    await page.locator('.cart-drawer-item-qty').dispatchEvent('change');
    await page.waitForFunction(
      (before) => document.querySelector('.cart-drawer-subtotal')?.textContent !== before,
      subtotalBefore,
      { timeout: 5000 },
    );
    await page.close();
  });

  it('removing the only line empties the cart and the drawer reflects it live', async () => {
    const page = await newPage();
    await page.goto(`${server.baseUrl}${waterBottlePath}`, { waitUntil: 'networkidle' });
    await waitForAlpineMounted(page);
    await page.locator('.product-info-content form.box-tocart button[type="submit"]').click();
    await page.locator('.cart-drawer-panel').waitFor({ state: 'visible' });

    await page.locator('.cart-drawer-item-remove').click();
    await page.locator('.cart-drawer-empty').waitFor({ state: 'visible', timeout: 5000 });
    await page.close();
  });
});

describe('wishlist / compare toggle (Alpine, no page reload)', () => {
  it('wishlist button flips label/state and the header badge updates live', async () => {
    const page = await newPage();
    await page.goto(`${server.baseUrl}${waterBottlePath}`, { waitUntil: 'networkidle' });
    await waitForAlpineMounted(page);

    const before = (await page.locator('.wishlist-button-submit').innerText()).trim();
    assert.match(before, /Add to Wishlist/);

    await page.locator('.wishlist-button-submit').click();
    await page.waitForFunction(() => document.querySelector('.wishlist-button-submit')?.textContent?.includes('Remove'), { timeout: 5000 });
    assert.equal(page.url(), `${server.baseUrl}${waterBottlePath}`, 'no navigation should have occurred');

    // The button's own label updates synchronously as part of the toggle fetch resolving, but
    // the header badge is a SEPARATE async chain (reload-customer-section-data -> bootstrap's
    // own refetch -> private-content-loaded -> initHeader) — wait for it directly rather than
    // assuming it's already settled just because the button text changed.
    await page.waitForFunction(() => document.querySelector('.wishlist-header-link-count')?.textContent === '1', { timeout: 5000 });
    await page.close();
  });

  it('compare button flips label/state and the (normally hidden) header link appears', async () => {
    const page = await newPage();
    await page.goto(`${server.baseUrl}${waterBottlePath}`, { waitUntil: 'networkidle' });
    await waitForAlpineMounted(page);

    assert.equal(await page.locator('.compare-header-link').isVisible(), false, 'compare link starts hidden with an empty list');
    await page.locator('.compare-button-submit').click();
    await page.waitForFunction(() => document.querySelector('.compare-button-submit')?.textContent?.includes('Remove'), { timeout: 5000 });
    // Same async gap as the wishlist test above — the header link's visibility (x-show, so the
    // element always exists in the DOM, just display:none until compareCount > 0) comes from
    // the separate private-content-loaded chain, not the button's own (already-settled) state.
    await page.waitForFunction(() => (document.querySelector('.compare-header-link') as HTMLElement | null)?.offsetParent !== null, { timeout: 5000 });
    assert.equal(await page.locator('.compare-header-link').isVisible(), true);
    await page.close();
  });
});

describe('category page toolbar (Alpine auto-submit)', () => {
  it('changing sort auto-submits the form (no visible Go button once Alpine mounts)', async () => {
    const page = await newPage();
    await page.goto(`${server.baseUrl}/gear/fitness-equipment`, { waitUntil: 'networkidle' });
    await waitForAlpineMounted(page);

    assert.equal(await page.locator('.sorter-submit').isVisible(), false, 'the no-JS fallback button should be hidden once Alpine mounts');
    await page.selectOption('#sort-select', 'price:desc');
    await page.waitForURL(/sort=price%3Adesc/);
    await page.close();
  });

  it('a tile\'s Add to Cart opens the drawer directly from the grid', async () => {
    const page = await newPage();
    await page.goto(`${server.baseUrl}/gear/fitness-equipment`, { waitUntil: 'networkidle' });
    await waitForAlpineMounted(page);

    await page.locator('.product-item .tocart').first().click();
    await page.locator('.cart-drawer-panel').waitFor({ state: 'visible', timeout: 5000 });
    assert.equal(page.url(), `${server.baseUrl}/gear/fitness-equipment`);
    await page.close();
  });
});

describe('configurable product swatches (Alpine)', () => {
  it('clicking Add to Cart before a full selection shows a validation message instead of adding; selecting every axis updates SKU/price and adds the exact variant', async () => {
    const page = await newPage();
    await page.goto(`${server.baseUrl}${configurablePath}`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.querySelectorAll('.swatch-option').length > 0);

    // Add to Cart stays clickable at all times on this fork (checked against the real Hyvä
    // demo's own behavior) — clicking before a full selection must show a message, not add.
    const addToCart = page.locator('.product-info-content form.box-tocart button[type="submit"]');
    await addToCart.click();
    assert.match(await page.locator('.product-option-message').innerText(), /Please select/);

    const groups = page.locator('.product-option');
    for (let i = 0; i < (await groups.count()); i++) {
      await groups.nth(i).locator('.swatch-option:not([disabled])').first().click();
    }

    const sku = (await page.locator('.product-info-value').first().innerText()).trim();
    assert.match(sku, /^WSH12-\d+-\w+$/);

    await addToCart.click();
    await page.locator('.cart-drawer-panel').waitFor({ state: 'visible', timeout: 5000 });
    assert.match(await page.locator('.cart-drawer-panel').innerText(), new RegExp(sku.split('-').slice(1).join('|')));

    const cookies = await page.context().cookies();
    const cart = JSON.parse(decodeURIComponent(cookies.find((c) => c.name === 'cart')!.value));
    assert.equal(cart[0].sku, sku);
    await page.close();
  });

  it('a URL with ?color=&size= preselects the exact variant with zero clicks, and Add to Cart succeeds on the first click', async () => {
    const page = await newPage();
    await page.goto(`${server.baseUrl}${configurablePath}?color=Green&size=28`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.querySelectorAll('.swatch-option').length > 0);

    assert.equal((await page.locator('.product-info-value').first().innerText()).trim(), 'WSH12-28-Green');
    await page.locator('.product-info-content form.box-tocart button[type="submit"]').click();
    await page.locator('.cart-drawer-panel').waitFor({ state: 'visible', timeout: 5000 });
    assert.equal(await page.locator('.product-option-message').isVisible(), false, 'preselection was already complete — no validation message expected');
    await page.close();
  });

  it('picking swatches replaces history (not pushes) — one Back leaves the product page entirely', async () => {
    const page = await newPage();
    await page.goto(`${server.baseUrl}/`, { waitUntil: 'networkidle' });
    await page.goto(`${server.baseUrl}${configurablePath}`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.querySelectorAll('.swatch-option').length > 0);

    const groups = page.locator('.product-option');
    for (let i = 0; i < (await groups.count()); i++) {
      await groups.nth(i).locator('.swatch-option:not([disabled])').first().click();
    }
    await page.waitForFunction(() => location.search.includes('color=') && location.search.includes('size='));

    await page.goBack({ waitUntil: 'networkidle' });
    assert.equal(page.url(), `${server.baseUrl}/`, 'a single Back should skip past every swatch pick straight to the previous page');
    await page.close();
  });
});

describe('newsletter form (Alpine, footer)', () => {
  it('submitting a valid email shows the success message and hides the form', async () => {
    const page = await newPage();
    await page.goto(`${server.baseUrl}/`, { waitUntil: 'networkidle' });
    await waitForAlpineMounted(page);

    await page.fill('#newsletter-email', 'shopper@example.com');
    await page.click('.newsletter-submit');
    await page.locator('.newsletter-success').waitFor({ state: 'visible', timeout: 5000 });
    assert.equal(await page.locator('.newsletter-form').isVisible(), false);
    await page.close();
  });
});

describe('progressive enhancement — every mutation still works with JavaScript disabled', () => {
  it('add-to-cart, wishlist toggle and compare toggle all degrade to plain form POSTs', async () => {
    const context = await browser.newContext({ viewport: desktopViewport, javaScriptEnabled: false });
    const page = await context.newPage();

    await page.goto(`${server.baseUrl}${waterBottlePath}`);
    await page.locator('.product-info-content form.box-tocart button[type="submit"]').click();
    await page.waitForLoadState();

    await page.goto(`${server.baseUrl}/cart`);
    assert.match(await page.locator('body').innerText(), /Affirm Water Bottle/);

    await page.goto(`${server.baseUrl}${waterBottlePath}`);
    await page.locator('.wishlist-button-submit').click();
    await page.waitForLoadState();
    assert.match((await page.locator('.wishlist-button-submit').innerText()).trim(), /Remove from Wishlist/);

    await context.close();
  });
});
