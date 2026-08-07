import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import StockStatus from '../../../src/components/library/StockStatus';
import AvailabilityDot from '../../../src/components/library/AvailabilityDot';
import ProductBadges from '../../../src/components/library/ProductBadges';
import RatingStars from '../../../src/components/library/RatingStars';
import ReviewSummary from '../../../src/components/library/ReviewSummary';

describe('StockStatus', () => {
  test('out of stock wins over any quantity', () => {
    const html = renderToStaticMarkup(<StockStatus inStock={false} quantity={50} />);
    assert.match(html, /stock-status-out/);
    assert.match(html, /Out of stock/);
  });

  test('low-stock variant at or below the threshold', () => {
    const html = renderToStaticMarkup(<StockStatus inStock quantity={3} />);
    assert.match(html, /stock-status-low/);
    assert.match(html, /Only 3 left/);
  });

  test('in stock without quantity information', () => {
    const html = renderToStaticMarkup(<StockStatus inStock />);
    assert.match(html, /stock-status-in/);
    assert.match(html, /In stock/);
  });

  test('custom threshold is respected', () => {
    const html = renderToStaticMarkup(<StockStatus inStock quantity={8} lowThreshold={10} />);
    assert.match(html, /Only 8 left/);
  });
});

describe('AvailabilityDot', () => {
  test('maps status to its dot color', () => {
    assert.match(renderToStaticMarkup(<AvailabilityDot status="available" label="Ready" />), /bg-green-500/);
    assert.match(renderToStaticMarkup(<AvailabilityDot status="unavailable" label="Gone" />), /bg-red-500/);
  });
});

describe('ProductBadges', () => {
  test('renders only the set flags', () => {
    const html = renderToStaticMarkup(<ProductBadges isNew onSale />);
    assert.match(html, /product-badge-new/);
    assert.match(html, /product-badge-sale/);
    assert.doesNotMatch(html, /product-badge-featured/);
  });

  test('renders nothing with no flags', () => {
    assert.equal(renderToStaticMarkup(<ProductBadges />), '');
  });
});

describe('RatingStars', () => {
  test('fills the rounded number of stars', () => {
    const html = renderToStaticMarkup(<RatingStars value={3.6} />);
    const filled = (html.match(/text-amber-500/g) ?? []).length;
    const empty = (html.match(/text-gray-300/g) ?? []).length;
    assert.equal(filled, 4);
    assert.equal(empty, 1);
  });

  test('clamps out-of-range values', () => {
    const overMax = renderToStaticMarkup(<RatingStars value={9} />);
    assert.equal((overMax.match(/text-amber-500/g) ?? []).length, 5);
    const negative = renderToStaticMarkup(<RatingStars value={-2} />);
    assert.equal((negative.match(/text-amber-500/g) ?? []).length, 0);
  });

  test('exposes an accessible label', () => {
    assert.match(renderToStaticMarkup(<RatingStars value={4} />), /aria-label="4 out of 5 stars"/);
  });
});

describe('ReviewSummary', () => {
  test('singular/plural review wording', () => {
    assert.match(renderToStaticMarkup(<ReviewSummary value={5} count={1} />), /\(1 review\)/);
    assert.match(renderToStaticMarkup(<ReviewSummary value={4} count={12} />), /\(12 reviews\)/);
  });
});
