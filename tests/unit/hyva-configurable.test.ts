import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { buildConfigurablePanelData } from '../../src/lib/hyva/configurable';
import type { Product } from '../../src/lib/types/index.ts';

function configurableFixture(): Product {
  return {
    id: 12,
    sku: 'WSH12',
    slug: 'erika-running-short',
    title: 'Erika Running Short',
    shortDescription: null,
    description: null,
    categoryId: 3,
    categoryPath: 'women/bottoms-women/shorts-women',
    brandId: null,
    brand: null,
    image: '/media/wsh12.jpg',
    imageLarge: '/media/wsh12-large.jpg',
    gallery: ['/media/wsh12.jpg', '/media/wsh12-alt.jpg'],
    prices: [{ quantity: 1, amount: 45, currency: 'USD' }],
    attributes: [],
    inStock: true,
    isFeatured: false,
    isNewArrival: false,
    variants: [
      {
        sku: 'WSH12-28-Green',
        options: [
          { code: 'color', label: 'Color', value: 'Green', swatchType: 'color', swatch: '#53a828' },
          { code: 'size', label: 'Size', value: '28', swatchType: 'text' },
        ],
        image: '/media/wsh12-green.jpg',
        gallery: ['/media/wsh12-green-alt.jpg'],
        price: 45,
        inStock: true,
      },
      {
        sku: 'WSH12-30-Green',
        options: [
          { code: 'color', label: 'Color', value: 'Green', swatchType: 'color', swatch: '#53a828' },
          { code: 'size', label: 'Size', value: '30', swatchType: 'text' },
        ],
        image: '/media/wsh12-green.jpg',
        gallery: [],
        price: 45,
        inStock: false, // out of stock — exercises availability filtering
      },
      {
        sku: 'WSH12-28-Red',
        options: [
          { code: 'color', label: 'Color', value: 'Red', swatchType: 'color', swatch: '#c0392b' },
          { code: 'size', label: 'Size', value: '28', swatchType: 'text' },
        ],
        image: '/media/wsh12-red.jpg',
        gallery: [],
        price: 47,
        inStock: true,
      },
    ],
  };
}

describe('buildConfigurablePanelData', () => {
  test('derives one axis per distinct option code, in first-seen order, with deduped values', () => {
    const data = buildConfigurablePanelData(configurableFixture(), {});
    assert.deepEqual(
      data.axes.map((axis) => axis.code),
      ['color', 'size'],
    );
    assert.deepEqual(
      data.axes.find((axis) => axis.code === 'color')!.options.map((option) => option.value),
      ['Green', 'Red'],
    );
    assert.deepEqual(
      data.axes.find((axis) => axis.code === 'size')!.options.map((option) => option.value),
      ['28', '30'],
    );
  });

  test('precomputes each axis slug the same way slugifyOptionLabel would', () => {
    const data = buildConfigurablePanelData(configurableFixture(), {});
    assert.equal(data.axes.find((axis) => axis.code === 'color')!.slug, 'color');
  });

  test('hasPriceRange is true when variants are priced differently ($45/$45/$47 in the fixture)', () => {
    const data = buildConfigurablePanelData(configurableFixture(), {});
    assert.equal(data.hasPriceRange, true);
  });

  test('hasPriceRange is false when every variant shares the same price', () => {
    const fixture = configurableFixture();
    fixture.variants = fixture.variants.map((variant) => ({ ...variant, price: 45 }));
    const data = buildConfigurablePanelData(fixture, {});
    assert.equal(data.hasPriceRange, false);
  });

  test('hasPriceRange is false with only one variant (nothing to range against)', () => {
    const fixture = configurableFixture();
    fixture.variants = [fixture.variants[0]];
    const data = buildConfigurablePanelData(fixture, {});
    assert.equal(data.hasPriceRange, false);
  });

  test('carries swatch metadata through untouched', () => {
    const data = buildConfigurablePanelData(configurableFixture(), {});
    const green = data.axes.find((axis) => axis.code === 'color')!.options.find((option) => option.value === 'Green')!;
    assert.equal(green.swatchType, 'color');
    assert.equal(green.swatch, '#53a828');
  });

  test('one variant entry per product variant, options flattened to a code->value map', () => {
    const data = buildConfigurablePanelData(configurableFixture(), {});
    assert.equal(data.variants.length, 3);
    const first = data.variants.find((variant) => variant.sku === 'WSH12-28-Green')!;
    assert.deepEqual(first.options, { color: 'Green', size: '28' });
    assert.equal(first.priceFormatted, '$45.00');
    assert.equal(first.inStock, true);
  });

  test('variant/product images are resolved through nextImageUrl (query-string /_next/image URLs)', () => {
    const data = buildConfigurablePanelData(configurableFixture(), {});
    const first = data.variants.find((variant) => variant.sku === 'WSH12-28-Green')!;
    assert.match(first.image!.full, /^\/_next\/image\?url=/);
    assert.match(first.image!.thumb, /^\/_next\/image\?url=/);
    assert.notEqual(first.image!.full, first.image!.thumb, 'full and thumb should request different widths');
  });

  test('preselect restores only values that actually exist on some variant, keyed by axis slug', () => {
    const withValid = buildConfigurablePanelData(configurableFixture(), { color: 'Green', size: '28' });
    assert.deepEqual(withValid.preselect, { color: 'Green', size: '28' });

    const withInvalid = buildConfigurablePanelData(configurableFixture(), { color: 'Purple', size: '28' });
    assert.deepEqual(withInvalid.preselect, { size: '28' });
  });

  test('preselect ignores unrelated query params and array-valued params (takes the first entry)', () => {
    const data = buildConfigurablePanelData(configurableFixture(), { color: ['Green', 'Red'], utm_source: 'newsletter' });
    assert.deepEqual(data.preselect, { color: 'Green' });
  });

  test('a simple product (no variants) yields empty axes/variants and no preselect', () => {
    const data = buildConfigurablePanelData({ ...configurableFixture(), variants: [] }, { color: 'Green' });
    assert.deepEqual(data.axes, []);
    assert.deepEqual(data.variants, []);
    assert.deepEqual(data.preselect, {});
  });
});
