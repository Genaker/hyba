import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { productUrl, productUrlWithOptions, slugifyOptionLabel } from '../../src/lib/urls';

describe('slugifyOptionLabel', () => {
  test('lowercases and hyphenates a multi-word label', () => {
    assert.equal(slugifyOptionLabel('Pack Size'), 'pack-size');
  });

  test('collapses runs of non-alphanumeric characters into a single hyphen', () => {
    assert.equal(slugifyOptionLabel('Color / Finish!!'), 'color-finish');
  });

  test('trims leading/trailing hyphens produced by leading/trailing punctuation', () => {
    assert.equal(slugifyOptionLabel('  Size  '), 'size');
    assert.equal(slugifyOptionLabel('-Color-'), 'color');
  });

  test('a single-word label just lowercases', () => {
    assert.equal(slugifyOptionLabel('Color'), 'color');
    assert.equal(slugifyOptionLabel('SIZE'), 'size');
  });

  test('is stable under repeated application (idempotent)', () => {
    const once = slugifyOptionLabel('Pack Size');
    assert.equal(slugifyOptionLabel(once), once);
  });
});

describe('productUrlWithOptions', () => {
  const product = { categoryPath: 'men/tops-men/tees-men', slug: 'balboa-persistence-tee' };

  test('falls back to the bare productUrl when there are no options', () => {
    assert.equal(productUrlWithOptions(product, []), productUrl(product));
    assert.equal(productUrlWithOptions(product, []), '/men/tops-men/tees-men/balboa-persistence-tee');
  });

  test('appends each option as a slugified-label query param', () => {
    const url = productUrlWithOptions(product, [
      { label: 'Color', value: 'Green' },
      { label: 'Size', value: 'M' },
    ]);
    assert.equal(url, '/men/tops-men/tees-men/balboa-persistence-tee?color=Green&size=M');
  });

  test('only the label is slugified into the key — the value is preserved verbatim (URL-encoded)', () => {
    const url = productUrlWithOptions(product, [{ label: 'Pack Size', value: '12 Pack' }]);
    const params = new URL(url, 'http://example.test').searchParams;
    assert.equal(params.get('pack-size'), '12 Pack');
  });

  test('a provider code that does not match slugify(label) still round-trips via the label', () => {
    // Regression: Salesforce's option `code` is "packsize" but its `label` is "Pack Size" —
    // the query key must come from the label (both directions), not the provider's own code.
    const url = productUrlWithOptions(product, [{ label: 'Pack Size', value: '6 Pack' }]);
    assert.match(url, /\?pack-size=/);
    assert.doesNotMatch(url, /\?packsize=/);
  });

  test('works for a top-level product with an empty categoryPath', () => {
    const url = productUrlWithOptions({ categoryPath: '', slug: 'a-product' }, [{ label: 'Size', value: 'M' }]);
    assert.equal(url, '/a-product?size=M');
  });

  test('a repeated axis label keeps only the last value (URLSearchParams.set semantics)', () => {
    const url = productUrlWithOptions(product, [
      { label: 'Size', value: 'S' },
      { label: 'Size', value: 'M' },
    ]);
    const params = new URL(url, 'http://example.test').searchParams;
    assert.equal(params.get('size'), 'M');
    assert.equal(params.getAll('size').length, 1);
  });
});
