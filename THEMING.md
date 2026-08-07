# Theming & Extensibility

The storefront styles with a **hybrid** approach, modeled on
[Tailwind-Luna](https://github.com/Genaker/Tailwind-Luna) (a Magento theme
that keeps Magento's semantic classes alongside Tailwind utilities): every
element carries both Tailwind utility classes *and* a stable, human-readable
semantic class. Utilities define the shipped look; the semantic classes are
your customization hooks — restyle anything with plain CSS, no TSX edits.

One principle governs all of it — **source code ownership / explicit
composition**: a page renders exactly what its `page.tsx` composes. There is
no layout-XML/layout-yml engine (Magento/Oro style) that merges page
structure from configuration at runtime — the three layers below are the
*only* customization mechanisms, each declared in a file you own and can
read. See README "Source code ownership" for the full rationale.

There are three independent layers, from lightest to heaviest:

| Layer | File | Use it for |
|---|---|---|
| 1. Design tokens | `src/app/theme.css` | Brand colors, fonts — one change restyles everything derived from a token |
| 2. Human CSS | `src/overrides/custom.css` | Restyling any element via its semantic class; whole themes under `[data-theme=…]` |
| 3. Component overrides | `overrides.yaml` + `src/overrides/*.tsx` | Changing markup/behavior, not just style |

## 1. Design tokens (`src/app/theme.css`)

A single Tailwind 4 `@theme` block. Tokens generate utilities automatically
(`--color-brand-600` → `bg-brand-600`, `text-brand-600`, …) and are available
in custom CSS as `var(--color-brand-600)`.

| Token | Default | Role |
|---|---|---|
| `--color-brand-50/100/500/600/700` | teal scale (#eef7f6 … #0a4844) | primary actions, links, accents |
| `--color-accent` | `#f59e0b` | badges (mini-cart count) |
| `--color-ink` | `#1a2b33` | text |
| `--color-paper` | `#ffffff` | page background |
| `--color-mist` | `#f4f6f7` | borders, subtle fills |
| `--font-sans` | system stack | base font (overridable via `fonts:` in config.yaml) |

Changing a token here restyles every utility and custom rule that uses it.

## 2. Human CSS (`src/overrides/custom.css`)

Loaded into both CSS bundles on every page. Plain CSS targeting the semantic
classes — no Tailwind syntax needed:

```css
/* always applied */
.product-item-name { text-transform: uppercase; }

/* a whole switchable theme */
[data-theme='dark'] .page-header { background: var(--color-ink); }
```

### Theme activation

`config.yaml`:

```yaml
site:
  theme: luma     # stamps <body data-theme="luma">; "" = default look
```

Env override: `THEME=luma npm start` (same env-over-yaml pattern as
`DATA_PROVIDER`). When set, `<body>` gets `data-theme="<name>"` and any
`[data-theme='<name>']`-scoped rules in custom.css apply. The shipped
**luma** theme (Magento Luma-flavored header: white header, `#006bb4` blue
links/search, gray `#f0f0f0` nav bar, `#1979c3` action buttons) is the
working example — and is active by default for the Magento dataset.

## CMS content & Tailwind classes

Two CMS shapes store raw HTML strings rendered via `dangerouslySetInnerHTML`:
routable **CMS pages** (`gateway/data/*/cms-pages.json`, slug-addressed, rendered
by `CmsContent.tsx`) and embeddable **CMS content blocks**
(`gateway/data/*/cms-content.json`, string-id-addressed — e.g. the homepage's
`"home"` block — rendered by `CmsContentBlock.tsx` wherever a page places
them). Tailwind 4's JIT scanner only sees literal class strings inside real
source files listed via `@source` directives in `catalog.css`/`customer.css`
— it has no way to see classes that only exist inside JSON data loaded at
runtime. A Tailwind class used in CMS HTML but never seen by the scanner
silently renders unstyled (Tailwind never generated its CSS).

**`src/lib/cms-tailwind-classes.ts`** solves this: a whitelist manifest —
just a template-literal string listing every Tailwind class used anywhere in
CMS JSON content — that's `@source`'d in `catalog.css` purely so the scanner
picks the strings up. It's never imported by app code; its only job is to be
text-scanned at build time.

**Workflow for adding a new Tailwind class to CMS content:**
1. Add the exact class string to `CMS_TAILWIND_CLASSES` in `cms-tailwind-classes.ts` first.
2. Then reference it in the JSON content (`cms-pages.json` or `cms-content.json`).
3. Rebuild — skipping step 1 means the class renders unstyled.

**Cascade gotcha:** Tailwind wraps its generated utilities in `@layer
utilities`. Plain unlayered CSS — like `.rich-text h2`/`.rich-text a` in
`catalog.css`, applied as a fallback style for CMS content — always beats
*any* layered Tailwind utility regardless of specificity, per the CSS
Cascade Layers spec. If a CMS block mixes the `rich-text` class with Tailwind
utilities on the same elements those rules target (`h2`, `a`, …), the
utilities lose silently. Fix by appending Tailwind's `!` important-modifier
suffix to just the conflicting utilities (e.g. `text-2xl!`, `font-bold!`) —
and remember to whitelist the `!`-suffixed string too, since it's a distinct
class name to the scanner.


### The ✦ AI marker

Anything served by **embedding similarity** (not a literal text/category
match) is marked with a small `✦ AI` badge: quick-search suggestion rows
(`search-suggestion-ai`, when `matchType: 'semantic'`) and recommendation
rail titles (`product-recommendations-ai`, when the gateway reports
`mode: 'semantic'`). The badge renders ONLY when the AI engine actually
answered — an `auto` component that fell back to the standard engine shows no
badge, so the marker is always truthful. Restyle via the semantic classes;
the tooltip text comes from the `product.aiRecommendation` dictionary key.

## 3. Semantic class reference

Naming: Magento Luma's vocabulary where an analog exists, otherwise
descriptive kebab-case. Rule: each component root gets a block name; every
inner element gets `<block>-<element>`. These names are a **stable contract**
— renames are breaking changes for downstream themes.

| Area | Block roots (inner elements follow `<block>-<element>`) |
|---|---|
| Site chrome | `page-header`, `header-notice`, `header-content`, `logo`, `block-search` (`search-input`, `search-button`), `header-links`, `language-switcher`, `page-footer` (`footer-column`, `footer-links`, `footer-copyright`) |
| Navigation | `navigation`, `nav-items`, `nav-item`, `nav-link`, `nav-chevron` (dropdown indicator on items with a panel), `submenu` (`submenu-column`, `submenu-title`, `submenu-link`, `submenu-promo`), `mobile-nav-toggle`, `mobile-submenu` |
| Mini-cart | `minicart` (`minicart-toggle`, `minicart-count`, `minicart-content`, `minicart-items`, `minicart-item-*`, `minicart-subtotal`, `minicart-actions`) |
| Listing | `product-listing`, `filter-options` (`filter-group`, `filter-title`, `filter-option`, `filter-option-count`, `filter-price`), `toolbar` (`toolbar-count`, `sorter`, `view-modes`), `products-grid` / `products-list` / `products-compact`, `pages` (`pages-item`, `pages-item-current`) |
| Product tiles | `product-item` (`product-item-photo`, `product-item-name`, `product-item-sku`, `price`), `product-row` |
| Recommendations | `product-recommendations` (`product-recommendations-title`, `product-recommendations-ai`, `product-recommendations-items`, `product-recommendations-item`) — `data-flavor`/`data-mode` attrs carry the flavor + serving engine |
| Product gallery | `product-gallery` (`product-gallery-input`, `product-gallery-slide`, `product-gallery-trigger`, `product-gallery-frame`, `product-gallery-image`, `product-gallery-thumbs`, `product-gallery-thumb`, `product-gallery-thumb-image`) — CSS-only radio switching, max 8 slides; click-to-enlarge popup (`product-gallery-zoom-toggle`, `product-gallery-lightbox`, `-backdrop`, `-close`, `-image`); opt-in hover zoom via `ProductImageZoom` |
| Product page | `product-info-main` (`page-title`, `product-info-sku`, `price`, `price-tiers`, `product-options`, `swatch-option`, `product-specs`, `product-description`), `box-tocart` (`qty`, `tocart`), `related-products` |
| Home | `hero-slider` (`hero-slide`, `hero-slide-cta`, `hero-dots`), `product-rail`, `promo-blocks` |
| Cart | `cart-items` (`cart-item`, `cart-item-image`, `cart-item-name`, `cart-item-qty`, `cart-item-price`, `cart-item-remove`), `cart-summary` (`cart-totals`, `cart-checkout`) |
| Checkout | `checkout-form` (`checkout-contact`, `checkout-shipping`, `checkout-field`, `checkout-payment`), `checkout-summary`, `place-order`; confirmation: `order-confirmation`, `order-summary` |
| Account | `login-form`, `account-orders` (`order-row`), `shopping-lists` (`shopping-list`, `shopping-list-item`), `quick-order-form` |
| Misc | `breadcrumbs` (`breadcrumb-item`, `breadcrumb-link`), `page-title`, `page-subtitle`, `container-block`, `category-view`, `cms-content`, `cms-content-block` (embeddable CMS block, see CmsContentBlock.tsx), `rich-text`, `action-submit` |

Not sure of a name? Inspect the element in devtools — the semantic class is
always first in its class list.

## 4. Component overrides (markup changes)

For changes CSS can't do, declare the component in `overrides.yaml` and drop
`src/overrides/<Name>.tsx` — the `@/theme/<Name>` alias resolves to your file
at build time (details and the extend-vs-replace recipe: README "Custom
themes"). CSS from override components is picked up automatically (both
bundles `@source` the overrides directory).

## Recipe: restyle the header without touching TSX

1. Pick a theme name, e.g. `mybrand`, and set `site.theme: mybrand` in config.yaml.
2. In `src/overrides/custom.css`:
   ```css
   [data-theme='mybrand'] .page-header { background: #111; }
   [data-theme='mybrand'] .header-link { color: #fff; }
   [data-theme='mybrand'] .navigation { background: #222; }
   [data-theme='mybrand'] .nav-link { color: #ddd; }
   ```
3. Restart (`npm run build && npm start` — config.yaml is read at startup).
4. To ship both looks, keep each under its own `[data-theme=…]` scope and
   flip `site.theme` (or `THEME` env) per deployment.
