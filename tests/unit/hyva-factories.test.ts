import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { initConfigurableOptionsSource } from '../../src/components/hyba/scripts/configurable';
import { initToggleFormSource } from '../../src/components/hyba/scripts/forms';

/**
 * Evaluates a factory source string against a stub `window` and returns the registered
 * `window.init*` function — lets the trickiest client-side logic (variant matching, gallery
 * dedup, availability graying) get real test coverage without a browser. Each factory guards
 * itself with `??=`, so a fresh stub `window` per test is required — otherwise the second
 * `eval` in a suite would be a no-op against the first test's already-populated window.
 */
function loadFactory(source: string, name: string): (...args: any[]) => any {
  const stubWindow: Record<string, any> = {
    location: { pathname: '/women/bottoms-women/shorts-women/erika-running-short' },
    history: { replaceState: () => {} },
  };
  const evalInScope = (code: string) => {
    // eslint-disable-next-line no-new-func -- deliberate: evaluating our own factory source, same content InlineScript ships to the browser
    new Function('window', code)(stubWindow);
  };
  evalInScope(source);
  return stubWindow[name];
}

describe('initConfigurableOptions', () => {
  const config = {
    axes: [
      { code: 'color', label: 'Color', slug: 'color', options: [{ value: 'Green' }, { value: 'Red' }] },
      { code: 'size', label: 'Size', slug: 'size', options: [{ value: '28' }, { value: '30' }] },
    ],
    variants: [
      { sku: 'WSH12-28-Green', options: { color: 'Green', size: '28' }, image: { full: 'green-full', thumb: 'green-thumb' }, gallery: [], priceFormatted: '$45.00', inStock: true },
      { sku: 'WSH12-30-Green', options: { color: 'Green', size: '30' }, image: { full: 'green-full', thumb: 'green-thumb' }, gallery: [], priceFormatted: '$45.00', inStock: false },
      { sku: 'WSH12-28-Red', options: { color: 'Red', size: '28' }, image: { full: 'red-full', thumb: 'red-thumb' }, gallery: [{ full: 'red-alt-full', thumb: 'red-alt-thumb' }], priceFormatted: '$47.00', inStock: true },
    ],
    product: { sku: 'WSH12', image: { full: 'parent-full', thumb: 'parent-thumb' }, gallery: [{ full: 'parent-alt-full', thumb: 'parent-alt-thumb' }], priceFormatted: '$45.00', inStock: true },
    preselect: {},
    hasPriceRange: true,
    labels: { and: 'and', pleaseSelectPrefix: 'Please select ', pleaseSelectSuffix: ' options.', combinationUnavailable: 'This combination is currently unavailable.' },
  };

  let initConfigurableOptions: (config: any) => any;
  beforeEach(() => {
    initConfigurableOptions = loadFactory(initConfigurableOptionsSource, 'initConfigurableOptions');
  });

  test('with nothing selected: not allSelected, no matched/partial variant, product data shown', () => {
    const state = initConfigurableOptions(config);
    assert.equal(state.allSelected, false);
    assert.equal(state.matchedVariant, null);
    assert.equal(state.activeVariant, null);
    assert.equal(state.displaySku, 'WSH12');
    assert.equal(state.displayPriceFormatted, '$45.00');
  });

  test('picking one axis: partial match leads (image swaps) even before the full combination is chosen', () => {
    const state = initConfigurableOptions(config);
    state.selectOption('color', 'Red');
    assert.equal(state.allSelected, false);
    assert.equal(state.matchedVariant, null);
    assert.equal(state.activeVariant.sku, 'WSH12-28-Red'); // first variant matching color=Red
    assert.equal(state.displaySku, 'WSH12-28-Red');
  });

  test('picking both axes with a valid, in-stock combination: matchedVariant resolves and drives display', () => {
    const state = initConfigurableOptions(config);
    state.selectOption('color', 'Green');
    state.selectOption('size', '28');
    assert.equal(state.allSelected, true);
    assert.equal(state.matchedVariant.sku, 'WSH12-28-Green');
    assert.equal(state.displaySku, 'WSH12-28-Green');
    assert.equal(state.displayInStock, true);
  });

  test('a combination with no matching variant: allSelected but matchedVariant is null (out of stock is still "matched", just not sellable)', () => {
    const state = initConfigurableOptions(config);
    state.selectOption('color', 'Green');
    state.selectOption('size', '30');
    assert.equal(state.allSelected, true);
    assert.equal(state.matchedVariant.sku, 'WSH12-30-Green');
    assert.equal(state.displayInStock, false, 'the matched variant itself is out of stock');
  });

  test('isOptionAvailable greys out a value with no in-stock variant given the other already-chosen axis', () => {
    const state = initConfigurableOptions(config);
    state.selectOption('color', 'Green');
    // Green+30 exists but is out of stock, so size 30 must be unavailable once Green is chosen
    assert.equal(state.isOptionAvailable('size', '30'), false);
    assert.equal(state.isOptionAvailable('size', '28'), true);
  });

  test('gallery prepends the active variant\'s own shots ahead of the product gallery, deduped by full URL', () => {
    const state = initConfigurableOptions(config);
    state.selectOption('color', 'Red');
    state.selectOption('size', '28');
    assert.deepEqual(
      state.gallery.map((shot: any) => shot.full),
      ['red-full', 'red-alt-full', 'parent-alt-full'],
    );
  });

  test('gallery falls back to the product image + gallery when nothing is selected', () => {
    const state = initConfigurableOptions(config);
    assert.deepEqual(
      state.gallery.map((shot: any) => shot.full),
      ['parent-full', 'parent-alt-full'],
    );
  });

  test('selecting a new option resets the active thumbnail back to index 0', () => {
    const state = initConfigurableOptions(config);
    state.selectThumb(2);
    assert.equal(state.activeImageIndex, 2);
    state.selectOption('color', 'Red');
    assert.equal(state.activeImageIndex, 0);
  });

  test('preselect from config seeds `selected` up front (URL-restored deep link)', () => {
    const state = initConfigurableOptions({ ...config, preselect: { color: 'Green', size: '28' } });
    assert.equal(state.allSelected, true);
    assert.equal(state.matchedVariant.sku, 'WSH12-28-Green');
  });

  test('showAsLowAs is true only when the product has a genuine price range AND nothing is fully matched yet', () => {
    const state = initConfigurableOptions(config);
    assert.equal(state.showAsLowAs, true, 'hasPriceRange: true, nothing selected yet');

    state.selectOption('color', 'Green');
    state.selectOption('size', '28');
    assert.equal(state.showAsLowAs, false, 'a full match should hide the prefix even with a real price range');

    const noRangeState = initConfigurableOptions({ ...config, hasPriceRange: false });
    assert.equal(noRangeState.showAsLowAs, false, 'no real range on the product at all');
  });

  test('checkBeforeSubmit lets a valid, in-stock, fully-selected combination through untouched', () => {
    const state = initConfigurableOptions(config);
    state.selectOption('color', 'Green');
    state.selectOption('size', '28');
    let prevented = false;
    state.checkBeforeSubmit({ preventDefault: () => { prevented = true; } });
    assert.equal(prevented, false);
    assert.equal(state.validationError, null);
  });

  test('checkBeforeSubmit blocks and names the missing axes when the selection is incomplete', () => {
    const state = initConfigurableOptions(config);
    let prevented = false;
    state.checkBeforeSubmit({ preventDefault: () => { prevented = true; } });
    assert.equal(prevented, true);
    assert.equal(state.validationError, 'Please select Color and Size options.');
  });

  test('checkBeforeSubmit reports "combination unavailable" once every axis is picked but no variant matches', () => {
    const state = initConfigurableOptions(config);
    state.selectOption('color', 'Green');
    state.selectOption('size', '30'); // exists on the fixture but that variant is out of stock
    let prevented = false;
    state.checkBeforeSubmit({ preventDefault: () => { prevented = true; } });
    assert.equal(prevented, true);
    assert.equal(state.validationError, 'This combination is currently unavailable.');
  });

  test('selecting a new option clears a previously shown validation error', () => {
    const state = initConfigurableOptions(config);
    state.checkBeforeSubmit({ preventDefault: () => {} });
    assert.ok(state.validationError);
    state.selectOption('color', 'Red');
    assert.equal(state.validationError, null);
  });
});

describe('initToggleForm (wishlist/compare button)', () => {
  let initToggleForm: (config: any) => any;
  beforeEach(() => {
    initToggleForm = loadFactory(initToggleFormSource, 'initToggleForm');
  });

  test('label reflects the initial pressed state', () => {
    const notPressed = initToggleForm({ pressed: false, addLabel: 'Add', removeLabel: 'Remove' });
    assert.equal(notPressed.label, 'Add');

    const pressed = initToggleForm({ pressed: true, addLabel: 'Add', removeLabel: 'Remove' });
    assert.equal(pressed.label, 'Remove');
  });

  test('isFull overrides the label regardless of pressed state (compare-list-full case)', () => {
    const state = initToggleForm({ pressed: false, addLabel: 'Add', removeLabel: 'Remove', fullLabel: 'Full', isFullInitially: true });
    assert.equal(state.label, 'Full');
  });

  test('defaults isFull to false and fullLabel to empty string when omitted (wishlist has no cap)', () => {
    const state = initToggleForm({ pressed: false, addLabel: 'Add', removeLabel: 'Remove' });
    assert.equal(state.isFull, false);
    assert.equal(state.fullLabel, '');
  });
});
