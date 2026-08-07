# Hyba Alpine components

Everything under this directory implements this fork's Alpine.js islands —
the replacement for the original storefront's React client components
(`ConfigurableProductPanel`, `MiniCart`, `MegaMenu`, …) on a build that never
hydrates React (`config.yaml`: `javascript.mode: zero`). See the top-level
`THEMING.md` for the theme-override mechanism this is layered on top of, and
`/root/.claude/plans/soft-growing-nova.md` for the full implementation plan.

## Shape

- **`InlineScript.tsx`** — emits a component's Alpine factory as a classic
  (non-module) inline `<script>`, so it's defined before the deferred
  `public/js/hyva/bootstrap.mjs` module calls `Alpine.start()`.
- **`scripts/*.ts`** — factory sources as exported template-literal strings
  (`export const initGallerySource = \`window.initGallery ??= function (config) { ... }\``),
  not real TS functions — deterministic output, diffable, and Tailwind's
  `@source` scanner can find class names inside the template literal text.
  Every factory is guarded `window.initX ??=` so re-execution is a no-op.
- **`*.tsx`** (e.g. `CartDrawer.tsx`, `NavDesktop.tsx`) — the server
  components that render the markup + `x-data`/`x-show`/`@event` attributes
  and drop in the matching `<InlineScript>`.

## Passing server data into a factory

Server data goes **inside the `x-data` attribute as JSON**, not as a
`data-*` attribute:

```tsx
<div x-data={`initGallery(${jsonForAttribute(config)})`}>
```

`jsonForAttribute` (`src/lib/hyva/inline.ts`) only escapes what stays valid
once the browser hands the *unescaped* attribute value to Alpine's
expression evaluator — React's own JSX attribute serialization already
handles the HTML-level escaping.

## Event contract

| Event (on `window`) | Payload | Producer → Consumer |
|---|---|---|
| `private-content-loaded` | `{ data: CustomerSectionsPayload }` | bootstrap fetch / mutation responses → header badges, cart drawer |
| `reload-customer-section-data` | — | any mutation → bootstrap (refetch, re-dispatch `private-content-loaded`) |
| `toggle-cart` | `{ isOpen? }` | header cart icon, add-to-cart success → cart drawer |
| `toggle-mobile-menu` | — | burger button → mobile menu |
| `update-gallery` | `{ imageIndex }` / `{ images }` | swatch selection → PDP gallery |
| `update-prices` | `{ finalPrice, oldPrice? }` | swatch selection → PDP price box |

## Progressive enhancement

Every mutating control keeps its existing server-action `<form>` markup as a
no-JS fallback; the Alpine factory intercepts with `@submit.prevent`, POSTs
JSON to the matching `/api/...` route handler, and dispatches
`reload-customer-section-data`. Nothing here breaks with JS disabled.
