import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { chromium, type Browser } from 'playwright-core';
import { startTestServer, type TestServer } from './test-server.ts';

/**
 * Web Vitals via native browser Performance APIs — no Lighthouse dependency.
 * Chromium buffers layout-shift / longtask / largest-contentful-paint entries
 * on the performance timeline automatically, so they're queryable after the
 * fact via getEntriesByType even without registering an observer up front.
 */
interface WebVitals {
  cls: number;         // cumulative layout shift (unitless)
  lcp: number;          // largest contentful paint, ms from navigation start
  tbt: number;           // total blocking time, ms — sum of (long task duration - 50ms)
}

// largest-contentful-paint entries are only reliably available on the timeline
// if a PerformanceObserver was registered before/during load — unlike
// layout-shift/longtask, which Chromium buffers automatically regardless.
// So all three are collected the same way for consistency: an observer
// installed via an init script, before any navigation happens.
const collectWebVitalsScript = `
  window.__webVitals = { cls: 0, lcp: 0, tbt: 0 };
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__webVitals.cls += entry.value;
    }).observe({ type: 'layout-shift', buffered: true });
  } catch {}
  try {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length) window.__webVitals.lcp = entries[entries.length - 1].startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {}
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) window.__webVitals.tbt += Math.max(0, entry.duration - 50);
    }).observe({ type: 'longtask', buffered: true });
  } catch {}
`;

async function measureWebVitals(page: import('playwright-core').Page, url: string): Promise<WebVitals> {
  await page.addInitScript(collectWebVitalsScript);
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(1500);   // let any deferred paint / late images settle

  return page.evaluate(() => (window as unknown as { __webVitals: WebVitals }).__webVitals);
}

// Core Web Vitals "good" thresholds, plus the user's explicit TBT ceiling.
const MAX_CLS = 0.1;
const MAX_LCP_MS = 2500;
const MAX_TBT_MS = 200;

let server: TestServer;
let browser: Browser;

before(async () => {
  // This fork's own zero-JS default (see config.yaml) is the configuration that matters here —
  // Alpine islands only, no React hydration bundle — so no JS_MODE override, unlike the
  // original storefront's oro-data performance suite this was adapted from.
  server = await startTestServer(3102, { DATA_PROVIDER: 'raw-magento-data' });
  browser = await chromium.launch({ args: ['--no-sandbox'] });
});

after(async () => {
  await browser.close();
  server.stop();
});

const pagesUnderTest = [
  ['home', '/'],
  ['category', '/gear/fitness-equipment'],
  ['product', '/gear/fitness-equipment/affirm-water-bottle'],
] as const;

for (const [label, path] of pagesUnderTest) {
  describe(`${label} page performance`, () => {
    it(`has no meaningful layout shift (CLS <= ${MAX_CLS})`, async () => {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      const { cls } = await measureWebVitals(page, `${server.baseUrl}${path}`);
      await page.close();
      assert.ok(cls <= MAX_CLS, `${label}: CLS ${cls} exceeds ${MAX_CLS} — content is popping in after first paint`);
    });

    it(`keeps Total Blocking Time under ${MAX_TBT_MS}ms`, async () => {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      const { tbt } = await measureWebVitals(page, `${server.baseUrl}${path}`);
      await page.close();
      assert.ok(tbt < MAX_TBT_MS, `${label}: TBT ${tbt}ms exceeds ${MAX_TBT_MS}ms — main thread blocked too long during load`);
    });

    it(`paints its largest content within ${MAX_LCP_MS}ms`, async () => {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      const { lcp } = await measureWebVitals(page, `${server.baseUrl}${path}`);
      await page.close();
      assert.ok(lcp > 0 && lcp < MAX_LCP_MS, `${label}: LCP ${lcp}ms — expected a positive value under ${MAX_LCP_MS}ms`);
    });
  });
}
