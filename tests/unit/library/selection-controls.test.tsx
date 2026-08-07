import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import ColorSwatchGroup from '../../../src/components/library/ColorSwatchGroup';
import SizeSwatchGroup from '../../../src/components/library/SizeSwatchGroup';
import QuantityInput from '../../../src/components/library/QuantityInput';
import WishlistToggle from '../../../src/components/library/WishlistToggle';

describe('ColorSwatchGroup', () => {
  const options = [
    { value: 'blue', label: 'Blue', hex: '#1857f7' },
    { value: 'orange', label: 'Orange', hex: '#eb6703' },
  ];

  test('renders one radio per option under the given form name', () => {
    const html = renderToStaticMarkup(<ColorSwatchGroup name="color" options={options} />);
    assert.equal((html.match(/type="radio"/g) ?? []).length, 2);
    assert.equal((html.match(/name="color"/g) ?? []).length, 2);
  });

  test('pre-checks the selected option and paints the hex', () => {
    const html = renderToStaticMarkup(<ColorSwatchGroup name="color" options={options} selected="orange" />);
    assert.match(html, /<input[^>]*checked[^>]*value="orange"|<input[^>]*value="orange"[^>]*checked/);
    assert.match(html, /background-color:#eb6703/);
  });
});

describe('SizeSwatchGroup', () => {
  const options = [
    { value: 's', label: 'S' },
    { value: 'm', label: 'M', available: false },
  ];

  test('disables unavailable sizes', () => {
    const html = renderToStaticMarkup(<SizeSwatchGroup name="size" options={options} />);
    assert.match(html, /<input[^>]*disabled[^>]*value="m"|<input[^>]*value="m"[^>]*disabled/);
    assert.doesNotMatch(html, /<input[^>]*disabled[^>]*value="s"|<input[^>]*value="s"[^>]*disabled/);
  });
});

describe('QuantityInput', () => {
  test('renders a number input with the form name and bounds', () => {
    const html = renderToStaticMarkup(<QuantityInput name="qty" defaultValue={2} min={1} max={99} />);
    assert.match(html, /type="number"/);
    assert.match(html, /name="qty"/);
    assert.match(html, /value="2"/);
    assert.match(html, /min="1"/);
    assert.match(html, /max="99"/);
  });
});

describe('WishlistToggle', () => {
  test('renders a checkbox with the label', () => {
    const html = renderToStaticMarkup(<WishlistToggle label="Save" defaultChecked />);
    assert.match(html, /type="checkbox"/);
    assert.match(html, /checked/);
    assert.match(html, /Save/);
  });
});
