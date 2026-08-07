import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import ScrollToTopLink from '../../../src/components/library/ScrollToTopLink';
import BannerSlider from '../../../src/components/library/BannerSlider';
import ProductLabel from '../../../src/components/library/ProductLabel';
import BrandSlider from '../../../src/components/library/BrandSlider';
import ProductSlider from '../../../src/components/library/ProductSlider';
import ImageGallery from '../../../src/components/library/ImageGallery';

describe('ScrollToTopLink', () => {
  test('anchors to the target id', () => {
    assert.match(renderToStaticMarkup(<ScrollToTopLink />), /href="#top"/);
    assert.match(renderToStaticMarkup(<ScrollToTopLink targetId="page-top" />), /href="#page-top"/);
  });
});

describe('BannerSlider', () => {
  const slides = [
    { id: 'a', image: '/a.jpg', title: 'Sale', text: 'Up to 50%', href: '/sale', cta: 'Shop' },
    { id: 'b', image: '/b.jpg' },
  ];

  test('renders each slide with an anchor-dot pair', () => {
    const html = renderToStaticMarkup(<BannerSlider slides={slides} />);
    assert.match(html, /id="banner-a"/);
    assert.match(html, /href="#banner-b"/);
    assert.match(html, /Sale/);
    assert.match(html, /href="\/sale"/);
  });

  test('single slide gets no dots, empty renders nothing', () => {
    const single = renderToStaticMarkup(<BannerSlider slides={[slides[0]]} />);
    assert.doesNotMatch(single, /banner-slider-dots/);
    assert.equal(renderToStaticMarkup(<BannerSlider slides={[]} />), '');
  });
});

describe('ProductLabel', () => {
  test('maps variant and position to classes', () => {
    const html = renderToStaticMarkup(<ProductLabel text="Sale" variant="sale" position="top-right" />);
    assert.match(html, /product-label-sale/);
    assert.match(html, /bg-red-700/);
    assert.match(html, /top-2 right-2/);
    assert.match(html, />Sale</);
  });
});

describe('BrandSlider', () => {
  test('renders logo tiles, name fallback without logo', () => {
    const html = renderToStaticMarkup(<BrandSlider brands={[{ name: 'Acme', href: '/a', logo: '/acme.svg' }, { name: 'Zeta', href: '/z', logo: null }]} />);
    assert.match(html, /<img[^>]*alt="Acme"/);
    assert.match(html, /brand-slider-name[^>]*>Zeta/);
  });

  test('renders nothing with no brands', () => {
    assert.equal(renderToStaticMarkup(<BrandSlider brands={[]} />), '');
  });
});

describe('ProductSlider', () => {
  test('renders card with title, price and image placeholder fallback', () => {
    const html = renderToStaticMarkup(
      <ProductSlider products={[{ title: 'Espresso Pods', href: '/p1', image: '/p1.jpg', price: 12.5 }, { title: 'Grinder', href: '/p2', image: null, price: 99 }]} />,
    );
    assert.match(html, /Espresso Pods/);
    assert.match(html, /\$12\.50/);
    assert.match(html, /product-slider-placeholder/);
  });
});

describe('ImageGallery', () => {
  const images = [
    { src: '/1.jpg', alt: 'Front' },
    { src: '/2.jpg', alt: 'Back' },
  ];

  test('main images carry ids that thumbnail anchors target', () => {
    const html = renderToStaticMarkup(<ImageGallery images={images} />);
    assert.match(html, /id="gallery-0"/);
    assert.match(html, /href="#gallery-1"/);
  });

  test('single image renders no thumbnail strip', () => {
    assert.doesNotMatch(renderToStaticMarkup(<ImageGallery images={[images[0]]} />), /image-gallery-thumbs/);
  });
});
