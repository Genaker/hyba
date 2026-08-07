import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { chromium, type Browser, type Page } from 'playwright-core';
import { startTestServer, type TestServer } from './test-server.ts';

/**
 * Hybrid-styling layer (THEMING.md): semantic classes on every element +
 * [data-theme] scoping of human CSS in src/overrides/custom.css.
 */
let browser: Browser;
let lumaServer: TestServer;
let defaultServer: TestServer;

before(async () => {
  browser = await chromium.launch({ args: ['--no-sandbox'] });
  [lumaServer, defaultServer] = await Promise.all([
    startTestServer(3131, { DATA_PROVIDER: 'raw-magento-data', THEME: 'luma' }),
    startTestServer(3132, { DATA_PROVIDER: 'raw-magento-data', THEME: '' }),
  ]);
});

after(async () => {
  lumaServer?.stop();
  defaultServer?.stop();
  await browser?.close();
});

async function newPage(): Promise<Page> {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  return context.newPage();
}

describe('theme activation (data-theme + scoped custom.css)', () => {
  it('THEME=luma stamps body[data-theme] and applies the Luma nav/header styles', async () => {
    const page = await newPage();
    await page.goto(`${lumaServer.baseUrl}/`, { waitUntil: 'networkidle' });

    assert.equal(await page.locator('body').getAttribute('data-theme'), 'luma');
    const navBackground = await page.locator('nav.navigation').evaluate((nav) => getComputedStyle(nav).backgroundColor);
    assert.equal(navBackground, 'rgb(240, 240, 240)', 'Luma gray nav bar');
    const headerBackground = await page.locator('.page-header').first().evaluate((el) => getComputedStyle(el).backgroundColor);
    assert.equal(headerBackground, 'rgb(255, 255, 255)', 'Luma white header');
    await page.close();
  });

  it('with no THEME the body has no data-theme and the default look is untouched', async () => {
    const page = await newPage();
    await page.goto(`${defaultServer.baseUrl}/`, { waitUntil: 'networkidle' });

    assert.equal(await page.locator('body').getAttribute('data-theme'), null);
    const navBackground = await page.locator('nav.navigation').evaluate((nav) => getComputedStyle(nav).backgroundColor);
    assert.notEqual(navBackground, 'rgb(240, 240, 240)', 'Luma nav style must not leak into the default theme');
    await page.close();
  });
});

describe('semantic class hooks are present on every page (theme-independent)', () => {
  it('category page: block roots and inner-element hooks exist', async () => {
    const page = await newPage();
    await page.goto(`${defaultServer.baseUrl}/men`, { waitUntil: 'networkidle' });

    for (const selector of ['.page-header', '.mini-search', '.navigation', '.filter-options', '.filter-option-count', '.products-grid', '.product-item', '.product-item-name', '.price', '.page-footer']) {
      assert.ok((await page.locator(selector).count()) > 0, `expected ${selector} on the category page`);
    }
    await page.close();
  });

  it('product + cart pages: inner-element hooks exist (every-element rule, not just roots)', async () => {
    const page = await newPage();
    await page.goto(`${defaultServer.baseUrl}/men/tops-men/tees-men/balboa-persistence-tee`, { waitUntil: 'networkidle' });
    for (const selector of ['.product-info-main', '.page-title', '.product-options', '.swatch-option', '.box-tocart', '.tocart', '.breadcrumbs', '.breadcrumb-item']) {
      assert.ok((await page.locator(selector).count()) > 0, `expected ${selector} on the product page`);
    }

    const cartResponse = await page.goto(`${defaultServer.baseUrl}/cart`, { waitUntil: 'networkidle' });
    assert.equal(cartResponse?.status(), 200);
    // empty cart still renders the page block + cart-drawer chrome (this fork's MiniCart
    // replacement — see src/components/hyva/CartDrawer.tsx)
    for (const selector of ['.cart-page', '.cart-drawer-root', '.cart-drawer-trigger']) {
      assert.ok((await page.locator(selector).count()) > 0, `expected ${selector} on the cart page`);
    }
    await page.close();
  });
});
