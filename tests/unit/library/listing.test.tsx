import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import CategoryCard from '../../../src/components/library/CategoryCard';
import BrandCard from '../../../src/components/library/BrandCard';
import FacetChip from '../../../src/components/library/FacetChip';
import AppliedFilters from '../../../src/components/library/AppliedFilters';
import PaginationNav from '../../../src/components/library/PaginationNav';
import EmptyState from '../../../src/components/library/EmptyState';

describe('CategoryCard', () => {
  test('renders the image, title and product count', () => {
    const html = renderToStaticMarkup(<CategoryCard title="Coffee" href="/beverages/coffee" image="/media/coffee.jpg" productCount={24} />);
    assert.match(html, /href="\/beverages\/coffee"/);
    assert.match(html, /src="\/media\/coffee\.jpg"/);
    assert.match(html, /Coffee/);
    assert.match(html, /24 products/);
  });

  test('falls back to a placeholder block without an image', () => {
    const html = renderToStaticMarkup(<CategoryCard title="Coffee" href="/c" image={null} />);
    assert.match(html, /category-card-placeholder/);
    assert.doesNotMatch(html, /<img/);
  });
});

describe('BrandCard', () => {
  test('shows the logo when present, the name when not', () => {
    assert.match(renderToStaticMarkup(<BrandCard name="Acme" href="/b" logo="/logo.png" />), /<img[^>]*alt="Acme"/);
    assert.match(renderToStaticMarkup(<BrandCard name="Acme" href="/b" logo={null} />), /brand-card-name/);
  });
});

describe('FacetChip', () => {
  test('renders the label and an accessible remove link', () => {
    const html = renderToStaticMarkup(<FacetChip label="Color: Blue" removeHref="/c?x=1" />);
    assert.match(html, /Color: Blue/);
    assert.match(html, /aria-label="Remove filter Color: Blue"/);
    assert.match(html, /href="\/c\?x=1"/);
  });
});

describe('AppliedFilters', () => {
  test('renders chips plus clear-all', () => {
    const filters = [
      { label: 'Color: Blue', removeHref: '/c?remove=color' },
      { label: 'Size: M', removeHref: '/c?remove=size' },
    ];
    const html = renderToStaticMarkup(<AppliedFilters filters={filters} clearAllHref="/c" />);
    assert.equal((html.match(/facet-chip /g) ?? []).length, 2);
    assert.match(html, /Clear all/);
  });

  test('renders nothing with no active filters', () => {
    assert.equal(renderToStaticMarkup(<AppliedFilters filters={[]} clearAllHref="/c" />), '');
  });
});

describe('PaginationNav', () => {
  const hrefFor = (page: number) => `/c?page=${page}`;

  test('marks the current page and links the rest', () => {
    const html = renderToStaticMarkup(<PaginationNav page={2} pageCount={3} hrefFor={hrefFor} />);
    assert.match(html, /aria-current="page"[^>]*>2</);
    assert.match(html, /href="\/c\?page=1"/);
    assert.match(html, /href="\/c\?page=3"/);
  });

  test('prev/next appear only when applicable', () => {
    const first = renderToStaticMarkup(<PaginationNav page={1} pageCount={3} hrefFor={hrefFor} />);
    assert.doesNotMatch(first, /pagination-prev/);
    assert.match(first, /pagination-next/);
    const last = renderToStaticMarkup(<PaginationNav page={3} pageCount={3} hrefFor={hrefFor} />);
    assert.match(last, /pagination-prev/);
    assert.doesNotMatch(last, /pagination-next/);
  });

  test('renders nothing for a single page', () => {
    assert.equal(renderToStaticMarkup(<PaginationNav page={1} pageCount={1} hrefFor={hrefFor} />), '');
  });
});

describe('EmptyState', () => {
  test('renders title, message and action', () => {
    const html = renderToStaticMarkup(<EmptyState title="No results" message="Try fewer filters." actionHref="/search" actionLabel="Browse all" />);
    assert.match(html, /No results/);
    assert.match(html, /Try fewer filters\./);
    assert.match(html, /href="\/search"/);
  });

  test('action needs both href and label', () => {
    const html = renderToStaticMarkup(<EmptyState title="No results" actionHref="/search" />);
    assert.doesNotMatch(html, /empty-state-action/);
  });
});
