import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import ProductGallery from '../../src/components/ProductGallery';
import type { Product } from '../../src/lib/types/index.ts';

/**
 * Unit tests for the CSS-only product gallery (src/components/ProductGallery.tsx).
 * Rendered as static markup: switching is radios + peer classes, so the shipped
 * HTML alone is the contract — no client JS involved.
 */

function productFixture(overrides: Partial<Product> = {}): Product {
  return {
    id: 7,
    sku: 'MH07',
    slug: 'hero-hoodie',
    title: 'Hero Hoodie',
    shortDescription: null,
    description: null,
    categoryId: 1,
    categoryPath: 'men/tops-men',
    brandId: null,
    brand: null,
    image: '/media/mh07.jpg',
    imageLarge: '/media/mh07-large.jpg',
    gallery: ['/media/mh07.jpg', '/media/mh07-alt.jpg', '/media/mh07-back.jpg'],
    prices: [{ quantity: 1, amount: 54, currency: 'USD' }],
    attributes: [],
    variants: [],
    inStock: true,
    isFeatured: false,
    isNewArrival: false,
    ...overrides,
  };
}

const countOf = (html: string, pattern: RegExp) => (html.match(pattern) ?? []).length;

describe('ProductGallery', () => {
  test('renders one radio + slide + thumb per gallery image, first slide checked', () => {
    const html = renderToStaticMarkup(<ProductGallery product={productFixture()} />);
    assert.equal(countOf(html, /type="radio"/g), 3);
    assert.equal(countOf(html, /product-gallery-slide/g), 3);
    assert.equal(countOf(html, /class="product-gallery-thumb /g), 3);
    assert.match(html, /id="gallery-7-0"[^>]*checked/);
  });

  test('switching is CSS-only: peer classes bind each thumb/slide to its radio', () => {
    const html = renderToStaticMarkup(<ProductGallery product={productFixture()} />);
    assert.match(html, /peer\/g0/);
    assert.match(html, /peer-checked\/g2:block/);      // third slide reveals on its own radio
    assert.match(html, /peer-checked\/g1:border-brand-600/);   // second thumb marks itself active
    assert.match(html, /for="gallery-7-1"/);           // thumb label targets that radio
  });

  test('a single image renders no thumbnail strip', () => {
    const html = renderToStaticMarkup(<ProductGallery product={productFixture({ gallery: ['/media/only.jpg'] })} />);
    assert.equal(countOf(html, /product-gallery-slide/g), 1);
    assert.doesNotMatch(html, /product-gallery-thumbs/);
  });

  test('falls back to imageLarge when the product has no gallery', () => {
    const html = renderToStaticMarkup(<ProductGallery product={productFixture({ gallery: [] })} />);
    assert.equal(countOf(html, /product-gallery-slide/g), 1);
    assert.match(html, /mh07-large\.jpg/);
  });

  test('renders a placeholder when there is no imagery at all', () => {
    const html = renderToStaticMarkup(
      <ProductGallery product={productFixture({ gallery: [], image: null, imageLarge: null })} />,
    );
    assert.match(html, /product-image-placeholder/);
    assert.doesNotMatch(html, /product-gallery-slide/);
  });

  test('activeImage leads the gallery without duplicating itself', () => {
    const html = renderToStaticMarkup(
      <ProductGallery product={productFixture()} activeImage="/media/mh07-back.jpg" />,
    );
    assert.equal(countOf(html, /product-gallery-slide/g), 3);   // reordered, not appended
    const firstSlideIndex = html.indexOf('mh07-back.jpg');
    assert.ok(firstSlideIndex < html.indexOf('mh07.jpg'), 'the active image should render first');
  });

  test('the images prop replaces the product gallery (a variant\'s own shots)', () => {
    const html = renderToStaticMarkup(
      <ProductGallery product={productFixture()} images={['/media/black-1.jpg', '/media/black-2.jpg']} />,
    );
    assert.equal(countOf(html, /product-gallery-slide/g), 2);
    assert.match(html, /black-1\.jpg/);
    assert.doesNotMatch(html, /mh07-alt\.jpg/);
  });

  test('caps at 8 slides — each needs a static Tailwind peer entry', () => {
    const many = Array.from({ length: 12 }, (_, index) => `/media/shot-${index}.jpg`);
    const html = renderToStaticMarkup(<ProductGallery product={productFixture({ gallery: many })} />);
    assert.equal(countOf(html, /type="radio"/g), 8);
    assert.equal(countOf(html, /product-gallery-slide/g), 8);
  });

  test('default is a click-to-enlarge popup: checkbox + label per slide, no hover zoom', () => {
    const html = renderToStaticMarkup(<ProductGallery product={productFixture()} />);
    assert.equal(countOf(html, /product-gallery-zoom-toggle/g), 3);   // one popup per slide
    assert.match(html, /product-gallery-lightbox/);
    assert.match(html, /cursor-zoom-in/);
    assert.doesNotMatch(html, /group-hover\/frame:scale-150/, 'hover magnification is not the default');
    assert.doesNotMatch(html, /product-zoom\.js/, 'the zoom island must not load by default');
    assert.match(html, /gallery-lightbox\.js/, 'only the tiny Escape-to-close island loads');
  });

  test('lightbox={false} renders a plain frame with no popup markup', () => {
    const html = renderToStaticMarkup(<ProductGallery product={productFixture()} lightbox={false} />);
    assert.doesNotMatch(html, /product-gallery-lightbox/);
    assert.doesNotMatch(html, /product-gallery-zoom-toggle/);
    assert.doesNotMatch(html, /gallery-lightbox\.js/);
  });

  test('zoom is opt-in: passing it swaps in ProductImageZoom and its island', () => {
    const html = renderToStaticMarkup(<ProductGallery product={productFixture()} zoom />);
    assert.match(html, /group-hover\/frame:scale-150/);
    assert.match(html, /data-zoom/);
    assert.match(html, /product-zoom\.js/);
  });
});
