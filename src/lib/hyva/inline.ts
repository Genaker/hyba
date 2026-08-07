const LINE_SEPARATOR = String.fromCharCode(0x2028);
const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029);

/**
 * JSON for embedding as a JS expression inside an Alpine `x-data="initX(...)"` attribute
 * value. React escapes the surrounding HTML attribute itself (this isn't raw markup), so the
 * only remaining concern is keeping the text valid once the browser hands the *unescaped*
 * attribute string to Alpine's expression evaluator: U+2028/U+2029 are legal inside JSON
 * strings but historically terminated a line mid-expression in JS source, so they're escaped
 * defensively even though evergreen engines (this project's browserslist) fixed that in ES2019.
 */
export function jsonForAttribute(value: unknown): string {
  return JSON.stringify(value)
    .split(LINE_SEPARATOR).join('\\u2028')
    .split(PARAGRAPH_SEPARATOR).join('\\u2029');
}

/**
 * Escapes a factory script's source before it's inserted via `dangerouslySetInnerHTML`
 * (InlineScript.tsx) — that bypasses React's own escaping entirely, so an embedded `</script>`
 * (e.g. inside a translated string literal) would otherwise prematurely close the tag.
 */
export function escapeInlineScript(code: string): string {
  return code.replace(/<\/script/gi, '<\\/script');
}

/**
 * Bundles Alpine directives into one spreadable object. Required for any directive containing a
 * colon (`x-bind:href`, `x-on:click`, `x-transition:enter`) — Next's SWC/Turbopack JSX transform
 * rejects those at build time as a "JSX Namespace" attribute ("react does not support it yet"),
 * even though TypeScript's own parser accepts the syntax and it's valid Alpine/HTML. `tsc
 * --noEmit` passing is NOT sufficient proof this compiles — always verify with `next build`.
 * Spreading a plain object sidesteps JSX attribute-name grammar entirely (same trick layout.tsx
 * already uses for `data-theme`); used for every Alpine directive on affected elements, plain
 * (`x-data`, `x-show`, `x-cloak`, `x-model`) or colon-bearing, so each element carries a single
 * spread rather than a mix of JSX props and ad hoc spreads. A boolean `true` emits a bare
 * (valueless) attribute, e.g. `x-cloak`; `false`/`undefined` omits the key entirely.
 */
export function alpineAttrs(attrs: Record<string, string | boolean | undefined>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (value === false || value === undefined) continue;
    result[key] = value === true ? '' : value;
  }
  return result;
}
