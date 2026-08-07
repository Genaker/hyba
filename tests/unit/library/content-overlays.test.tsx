import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import BrandAlphabetIndex from '../../../src/components/library/BrandAlphabetIndex';
import Accordion from '../../../src/components/library/Accordion';
import ReviewList from '../../../src/components/library/ReviewList';
import StickyAddToCart from '../../../src/components/library/StickyAddToCart';
import CookieNotice from '../../../src/components/library/CookieNotice';
import FlashMessage from '../../../src/components/library/FlashMessage';
import Tabs from '../../../src/components/library/Tabs';
import Modal from '../../../src/components/library/Modal';
import Notification from '../../../src/components/library/Notification';
import PromoPopup from '../../../src/components/library/PromoPopup';

describe('BrandAlphabetIndex', () => {
  test('groups brands by first letter, sorted, with jump links', () => {
    const html = renderToStaticMarkup(
      <BrandAlphabetIndex brands={[{ name: 'Zeta', href: '/z' }, { name: 'Acme', href: '/a' }, { name: 'Alpine', href: '/al' }, { name: '3M', href: '/3m' }]} />,
    );
    assert.match(html, /href="#brands-A"/);
    assert.match(html, /id="brands-Z"/);
    assert.match(html, /id="brands-#"/); // non-alphabetic bucket
    assert.ok(html.indexOf('Acme') < html.indexOf('Alpine'), 'sorted within group');
  });
});

describe('Accordion', () => {
  const items = [
    { title: 'Shipping', content: 'Ships in 2 days' },
    { title: 'Returns', content: '30 days' },
  ];

  test('renders a details element per item, defaultOpenIndex open', () => {
    const html = renderToStaticMarkup(<Accordion items={items} defaultOpenIndex={1} />);
    assert.equal((html.match(/<details/g) ?? []).length, 2);
    assert.match(html, /<details[^>]*open[^>]*>[\s\S]*?Returns/);
  });

  test('exclusive mode names the details group for native single-open', () => {
    const html = renderToStaticMarkup(<Accordion items={items} exclusive name="faq" />);
    assert.equal((html.match(/name="faq"/g) ?? []).length, 2);
  });
});

describe('ReviewList', () => {
  test('renders reviews with rating stars and meta', () => {
    const html = renderToStaticMarkup(
      <ReviewList reviews={[{ author: 'Jordan', rating: 4, date: 'July 2026', title: 'Great', text: 'Works well.' }]} />,
    );
    assert.match(html, /Great/);
    assert.match(html, /Jordan — July 2026/);
    assert.match(html, /aria-label="4 out of 5 stars"/);
  });

  test('empty list shows the no-reviews message', () => {
    assert.match(renderToStaticMarkup(<ReviewList reviews={[]} />), /No reviews yet\./);
  });
});

describe('StickyAddToCart', () => {
  test('renders a form with product info, hidden sku and quantity', () => {
    const html = renderToStaticMarkup(<StickyAddToCart title="Lab Coat" price={42} sku="LC-1" action="/cart/add" />);
    assert.match(html, /action="\/cart\/add"/);
    assert.match(html, /Lab Coat/);
    assert.match(html, /\$42\.00/);
    assert.match(html, /type="hidden"[^>]*value="LC-1"|value="LC-1"[^>]*type="hidden"/);
    assert.match(html, /name="quantity"/);
  });
});

describe('CookieNotice', () => {
  test('CSS-only dismiss without an action: label toggles the checkbox', () => {
    const html = renderToStaticMarkup(<CookieNotice />);
    assert.match(html, /id="cookie-notice-dismiss"/);
    assert.match(html, /for="cookie-notice-dismiss"/);
    assert.match(html, /peer-checked:hidden/);
    assert.doesNotMatch(html, /<form/);
  });

  test('with acceptAction: renders a form submit instead of the label', () => {
    const html = renderToStaticMarkup(<CookieNotice acceptAction="/consent" />);
    assert.match(html, /action="\/consent"/);
    assert.match(html, /type="submit"/);
  });
});

describe('FlashMessage', () => {
  test('error uses role=alert, others role=status', () => {
    assert.match(renderToStaticMarkup(<FlashMessage type="error">Failed</FlashMessage>), /role="alert"/);
    assert.match(renderToStaticMarkup(<FlashMessage type="success">Saved</FlashMessage>), /role="status"/);
  });

  test('maps type to its color classes', () => {
    assert.match(renderToStaticMarkup(<FlashMessage type="warning">Low stock</FlashMessage>), /bg-amber-50/);
  });
});

describe('Tabs', () => {
  const tabs = [
    { label: 'Description', content: 'About the product' },
    { label: 'Specs', content: 'Details' },
  ];

  test('renders radios, labels and panels wired by id/for', () => {
    const html = renderToStaticMarkup(<Tabs name="pdp" tabs={tabs} />);
    assert.equal((html.match(/type="radio"/g) ?? []).length, 2);
    assert.match(html, /id="pdp-0"/);
    assert.match(html, /for="pdp-1"/);
    assert.match(html, /peer-checked\/tab0:block/);
  });

  test('defaultIndex pre-checks that tab', () => {
    const html = renderToStaticMarkup(<Tabs name="pdp" tabs={tabs} defaultIndex={1} />);
    assert.match(html, /<input[^>]*id="pdp-1"[^>]*checked|<input[^>]*checked[^>]*id="pdp-1"/);
  });

  test('caps at 6 tabs (static peer-name limit)', () => {
    const many = Array.from({ length: 8 }, (_, index) => ({ label: `Tab ${index}`, content: `${index}` }));
    const html = renderToStaticMarkup(<Tabs name="many" tabs={many} />);
    assert.equal((html.match(/type="radio"/g) ?? []).length, 6);
  });
});

describe('Modal', () => {
  test(':target modal with backdrop and close links', () => {
    const html = renderToStaticMarkup(<Modal id="size-guide" title="Size Guide">Chart here</Modal>);
    assert.match(html, /id="size-guide"/);
    assert.match(html, /target:flex/);
    assert.match(html, /role="dialog"/);
    assert.equal((html.match(/href="#!"/g) ?? []).length, 2);
  });
});

describe('Notification', () => {
  test('renders a dismissable toast scoped by id', () => {
    const html = renderToStaticMarkup(<Notification id="cart-note" type="success">Added to cart</Notification>);
    assert.match(html, /id="cart-note-dismiss"/);
    assert.match(html, /for="cart-note-dismiss"/);
    assert.match(html, /border-green-300/);
    assert.match(html, /Added to cart/);
  });
});

describe('PromoPopup', () => {
  test('visible overlay with checkbox dismiss', () => {
    const html = renderToStaticMarkup(<PromoPopup title="10% off">Subscribe and save</PromoPopup>);
    assert.match(html, /10% off/);
    assert.match(html, /peer-checked:hidden/);
    assert.match(html, /for="promo-popup-dismiss"/);
  });
});
