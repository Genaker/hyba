import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import PriceTag from '../../../src/components/library/PriceTag';
import DiscountBadge from '../../../src/components/library/DiscountBadge';
import TierPriceHint from '../../../src/components/library/TierPriceHint';
import UnitPrice from '../../../src/components/library/UnitPrice';
import SkuLabel from '../../../src/components/library/SkuLabel';
import CartTotalsRow from '../../../src/components/library/CartTotalsRow';
import FreeShippingMeter from '../../../src/components/library/FreeShippingMeter';

describe('PriceTag', () => {
  test('renders the formatted price', () => {
    const html = renderToStaticMarkup(<PriceTag amount={19.99} />);
    assert.match(html, /\$19\.99/);
    assert.match(html, /price-tag-current/);
  });

  test('shows a struck-through compare-at price only when it is higher', () => {
    const discounted = renderToStaticMarkup(<PriceTag amount={15} compareAt={20} />);
    assert.match(discounted, /<s[^>]*price-tag-compare[^>]*>\$20\.00<\/s>/);
    const notDiscounted = renderToStaticMarkup(<PriceTag amount={20} compareAt={15} />);
    assert.doesNotMatch(notDiscounted, /price-tag-compare/);
  });
});

describe('DiscountBadge', () => {
  test('computes the percent off', () => {
    const html = renderToStaticMarkup(<DiscountBadge amount={75} compareAt={100} />);
    assert.match(html, /-25%/);
  });

  test('renders nothing when there is no discount', () => {
    assert.equal(renderToStaticMarkup(<DiscountBadge amount={100} compareAt={100} />), '');
  });
});

describe('TierPriceHint', () => {
  const tiers = [
    { quantity: 1, amount: 12, currency: 'USD' },
    { quantity: 10, amount: 9.5, currency: 'USD' },
  ];

  test('shows the cheapest volume tier', () => {
    const html = renderToStaticMarkup(<TierPriceHint tiers={tiers} />);
    assert.match(html, /Buy 10\+ for \$9\.50 each/);
  });

  test('renders nothing for single-tier pricing', () => {
    assert.equal(renderToStaticMarkup(<TierPriceHint tiers={[tiers[0]]} />), '');
    assert.equal(renderToStaticMarkup(<TierPriceHint tiers={[]} />), '');
  });
});

describe('UnitPrice', () => {
  test('renders amount per unit', () => {
    assert.match(renderToStaticMarkup(<UnitPrice amount={0.42} unit="oz" />), /\$0\.42 \/ oz/);
  });
});

describe('SkuLabel', () => {
  test('renders the SKU', () => {
    assert.match(renderToStaticMarkup(<SkuLabel sku="WS12" />), /SKU: WS12/);
  });
});

describe('CartTotalsRow', () => {
  test('renders label and formatted amount', () => {
    const html = renderToStaticMarkup(<CartTotalsRow label="Subtotal" amount={104.5} />);
    assert.match(html, /Subtotal/);
    assert.match(html, /\$104\.50/);
  });

  test('emphasis variant adds the total styling class', () => {
    const html = renderToStaticMarkup(<CartTotalsRow label="Total" amount={104.5} emphasis />);
    assert.match(html, /cart-totals-row-total/);
  });
});

describe('FreeShippingMeter', () => {
  test('below threshold: shows the remaining amount and a partial bar', () => {
    const html = renderToStaticMarkup(<FreeShippingMeter subtotal={60} threshold={100} />);
    assert.match(html, /Add \$40\.00 more for free shipping/);
    assert.match(html, /width:60%/);
  });

  test('at threshold: qualifies, bar capped at 100%', () => {
    const html = renderToStaticMarkup(<FreeShippingMeter subtotal={150} threshold={100} />);
    assert.match(html, /You qualify for free shipping!/);
    assert.match(html, /width:100%/);
  });
});
