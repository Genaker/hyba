import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { jsonForAttribute, escapeInlineScript, alpineAttrs } from '../../src/lib/hyva/inline';
import InlineScript from '../../src/components/hyba/InlineScript';

describe('jsonForAttribute', () => {
  test('produces valid JSON for a plain object', () => {
    assert.equal(jsonForAttribute({ sku: 'ABC', count: 2 }), '{"sku":"ABC","count":2}');
  });

  test('escapes U+2028/U+2029 — legal inside JSON strings but historically broke JS-source parsers', () => {
    const withLineSeparator = jsonForAttribute({ title: `line1${String.fromCharCode(0x2028)}line2` });
    assert.ok(!withLineSeparator.includes(String.fromCharCode(0x2028)), 'raw U+2028 must not survive');
    assert.ok(withLineSeparator.includes('\\u2028'));

    const withParagraphSeparator = jsonForAttribute({ title: `a${String.fromCharCode(0x2029)}b` });
    assert.ok(!withParagraphSeparator.includes(String.fromCharCode(0x2029)));
    assert.ok(withParagraphSeparator.includes('\\u2029'));
  });

  test('round-trips through JSON.parse once the escapes are reversed (still valid JSON otherwise)', () => {
    const value = { a: 1, b: [1, 2, 3], c: 'quote " and backslash \\' };
    assert.deepEqual(JSON.parse(jsonForAttribute(value)), value);
  });
});

describe('escapeInlineScript', () => {
  test('escapes a closing script tag so it cannot prematurely terminate the element', () => {
    const code = 'const x = "</script>";';
    const escaped = escapeInlineScript(code);
    assert.ok(!escaped.includes('</script>'));
    assert.match(escaped, /<\\\/script>/);
  });

  test('is case-insensitive', () => {
    assert.ok(!escapeInlineScript('</SCRIPT>').includes('</SCRIPT>'));
  });

  test('leaves ordinary code untouched', () => {
    const code = 'window.initX ??= function () { return { a: 1 }; };';
    assert.equal(escapeInlineScript(code), code);
  });
});

describe('InlineScript', () => {
  test('renders a classic (non-module) script tag with the escaped code as raw HTML', () => {
    const html = renderToStaticMarkup(<InlineScript code={'window.x = 1;'} />);
    assert.match(html, /<script>window\.x = 1;<\/script>/);
  });

  test('a malicious-looking string embedded in the source cannot break out of the tag', () => {
    // An unescaped `<script>` (no slash) inside script content is inert — the browser's HTML
    // parser doesn't re-enter script parsing on an open tag while already inside one. Only a
    // literal `</script` sequence is dangerous (it terminates the element early), so that's the
    // only thing that must be absent from the rendered output.
    const html = renderToStaticMarkup(<InlineScript code={'const t = "</script><script>alert(1)</script>";'} />);
    assert.equal((html.match(/<\/script>/g) ?? []).length, 1, 'only the wrapping tag\'s own closing </script> should exist');
  });
});

describe('alpineAttrs', () => {
  test('passes string values through unchanged', () => {
    assert.deepEqual(alpineAttrs({ 'x-data': 'initFoo()', 'x-on:click': 'doThing()' }), {
      'x-data': 'initFoo()',
      'x-on:click': 'doThing()',
    });
  });

  test('true becomes a bare (empty-string) attribute', () => {
    assert.deepEqual(alpineAttrs({ 'x-cloak': true }), { 'x-cloak': '' });
  });

  test('false and undefined are omitted entirely', () => {
    assert.deepEqual(alpineAttrs({ 'x-cloak': false, 'x-show': undefined, 'x-data': 'initFoo()' }), { 'x-data': 'initFoo()' });
  });

  test('sidesteps JSX colon-attribute rejection — spreading the result compiles where a literal x-bind:href would not', () => {
    const html = renderToStaticMarkup(<a {...alpineAttrs({ 'x-bind:href': 'item.url' })}>link</a>);
    assert.match(html, /x-bind:href="item\.url"/);
  });
});
