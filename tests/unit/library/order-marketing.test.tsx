import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import PromoCodeField from '../../../src/components/library/PromoCodeField';
import PaymentMethodBadge from '../../../src/components/library/PaymentMethodBadge';
import AddressBlock from '../../../src/components/library/AddressBlock';
import OrderStatusBadge from '../../../src/components/library/OrderStatusBadge';
import OrderTimeline from '../../../src/components/library/OrderTimeline';
import TrustBadgeList from '../../../src/components/library/TrustBadgeList';
import NewsletterForm from '../../../src/components/library/NewsletterForm';
import SocialShareLinks from '../../../src/components/library/SocialShareLinks';

describe('PromoCodeField', () => {
  test('renders a form posting to the action', () => {
    const html = renderToStaticMarkup(<PromoCodeField action="/cart/promo" />);
    assert.match(html, /action="\/cart\/promo"/);
    assert.match(html, /name="promoCode"/);
  });

  test('shows the error only when given', () => {
    assert.match(renderToStaticMarkup(<PromoCodeField action="/a" error="Invalid code" />), /Invalid code/);
    assert.doesNotMatch(renderToStaticMarkup(<PromoCodeField action="/a" />), /promo-code-error/);
  });
});

describe('PaymentMethodBadge', () => {
  test('maps known method codes to display names', () => {
    assert.match(renderToStaticMarkup(<PaymentMethodBadge method="visa" />), /Visa/);
    assert.match(renderToStaticMarkup(<PaymentMethodBadge method="PO" />), /Purchase Order/);
  });

  test('unknown methods render as given', () => {
    assert.match(renderToStaticMarkup(<PaymentMethodBadge method="CryptoPay" />), /CryptoPay/);
  });
});

describe('AddressBlock', () => {
  const address = {
    firstName: 'Amanda', lastName: 'Cole', street: '1 Main St',
    city: 'Springfield', postalCode: '12345', country: 'United States', phone: '555-0100',
  };

  test('renders all address lines', () => {
    const html = renderToStaticMarkup(<AddressBlock address={address} />);
    assert.match(html, /Amanda Cole/);
    assert.match(html, /1 Main St/);
    assert.match(html, /Springfield, 12345/);
    assert.match(html, /United States/);
    assert.match(html, /555-0100/);
  });
});

describe('OrderStatusBadge', () => {
  test('maps known statuses to their color scheme', () => {
    assert.match(renderToStaticMarkup(<OrderStatusBadge status="delivered" />), /bg-green-100/);
    assert.match(renderToStaticMarkup(<OrderStatusBadge status="cancelled" />), /bg-red-100/);
  });

  test('unknown statuses get the neutral style', () => {
    assert.match(renderToStaticMarkup(<OrderStatusBadge status="archived" />), /bg-mist/);
  });
});

describe('OrderTimeline', () => {
  test('marks done / current / upcoming around the current index', () => {
    const html = renderToStaticMarkup(<OrderTimeline steps={['Placed', 'Shipped', 'Delivered']} currentIndex={1} />);
    assert.match(html, /order-timeline-step-done[^>]*>[\s\S]*?Placed/);
    assert.match(html, /order-timeline-step-current[^>]*>[\s\S]*?Shipped/);
    assert.match(html, /order-timeline-step-upcoming[^>]*>[\s\S]*?Delivered/);
  });
});

describe('TrustBadgeList', () => {
  test('renders each badge with optional text', () => {
    const html = renderToStaticMarkup(
      <TrustBadgeList badges={[{ title: 'Free Shipping', text: 'Orders over $75' }, { title: '30-day returns' }]} />,
    );
    assert.match(html, /Free Shipping/);
    assert.match(html, /Orders over \$75/);
    assert.match(html, /30-day returns/);
  });
});

describe('NewsletterForm', () => {
  test('renders a required email input posting to the action', () => {
    const html = renderToStaticMarkup(<NewsletterForm action="/newsletter" />);
    assert.match(html, /action="\/newsletter"/);
    assert.match(html, /type="email"[^>]*required/);
  });
});

describe('SocialShareLinks', () => {
  test('encodes the URL and title into each network link', () => {
    const html = renderToStaticMarkup(<SocialShareLinks url="https://shop.example/p?a=1" title="Great Product" />);
    assert.match(html, /facebook\.com\/sharer.*https%3A%2F%2Fshop\.example%2Fp%3Fa%3D1/);
    assert.match(html, /twitter\.com\/intent.*Great%20Product/);
    assert.match(html, /rel="noopener noreferrer"/);
  });
});
