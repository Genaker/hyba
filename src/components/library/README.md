# Ecommerce component library

46 reusable, presentational components — **not wired into any page, and
deliberately kept out of every bundle** until a page explicitly opts in.

## Zero bundle cost until used

Nothing in the app imports this directory, so Next.js ships **no JS** for it
(dead modules never enter the build graph), and neither `catalog.css` nor
`customer.css` has an `@source` line for it, so Tailwind generates **no CSS**
for it either. Two rules keep it that way:

1. **No barrel file — import each component directly, on purpose:**
   ```tsx
   import PriceTag from '@/components/library/PriceTag';   // ✅ pulls in ONE file
   ```
   There is intentionally no `index.ts` re-exporting everything: a barrel
   would let one convenient import drag all 46 components into the module
   graph. Don't add one.
2. **When adopting a component, also register its CSS** — add an `@source`
   line for that one file to whichever bundle the page uses, e.g. in
   `catalog.css`:
   ```css
   @source "../../components/library/PriceTag.tsx";
   ```
   Without it the component renders unstyled (Tailwind never saw its
   classes) — same rule as `cms-tailwind-classes.ts`, see THEMING.md.

Design rules (all of them follow the codebase's conventions):

- **Server-safe, zero JS** — no hooks, no event handlers. Interactivity is
  native HTML: `<details>` accordions, scroll-snap sliders, radio/checkbox
  hacks for tabs/dismissals, `:target` for the modal, forms posting to a
  server `action`. Same patterns MiniCart / the mobile nav / the hero slider
  already use.
- **Framework-portable** — plain `<a>`/`<img>`, no `next/link`/`next/image`
  imports; wrap at the use site when Next-specific behavior is wanted.
- **Semantic class + Tailwind hybrid** — every element carries a stable
  semantic class (`price-tag`, `accordion-item`, …) for theming via
  `src/overrides/custom.css` (see THEMING.md).
- **Unit-tested** — `tests/unit/library/*.test.tsx`, rendered with
  `react-dom/server` under `npm run test:unit`.

## Inventory

| Domain | Components |
|---|---|
| Pricing | `PriceTag`, `DiscountBadge`, `TierPriceHint`, `UnitPrice`, `CartTotalsRow`, `FreeShippingMeter` |
| Product info | `SkuLabel`, `StockStatus`, `AvailabilityDot`, `ProductBadges`, `ProductLabel`, `RatingStars`, `ReviewSummary`, `ReviewList` |
| Selection controls | `ColorSwatchGroup`, `SizeSwatchGroup`, `QuantityInput`, `WishlistToggle` |
| Listing & navigation | `CategoryCard`, `BrandCard`, `FacetChip`, `AppliedFilters`, `PaginationNav`, `EmptyState`, `BrandAlphabetIndex`, `ScrollToTopLink` |
| Sliders & media | `BannerSlider`, `BrandSlider`, `ProductSlider`, `ImageGallery` |
| Checkout & order | `PromoCodeField`, `PaymentMethodBadge`, `AddressBlock`, `OrderStatusBadge`, `OrderTimeline`, `StickyAddToCart` |
| Content & overlays | `Accordion`, `Tabs`, `Modal`, `PromoPopup`, `Notification`, `FlashMessage`, `CookieNotice` |
| Marketing | `TrustBadgeList`, `NewsletterForm`, `SocialShareLinks` |

Known CSS-only limits, stated on the components themselves: `Tabs` supports
max 6 tabs (static Tailwind peer names — dynamic class strings would generate
no CSS); `Modal` (`:target`) doesn't trap focus; `CookieNotice`/`PromoPopup`
dismissal is per-render unless you persist consent via the server `action`.

## Ready-to-go third-party React components

When a CSS-only component here hits its limits, these are the mature,
well-maintained options to reach for — grouped by what they'd replace or
complement. All are React 19-compatible unless noted.

### Headless primitives (styling stays ours — best fit for this codebase)

| Library | What it gives us | Would upgrade |
|---|---|---|
| [Radix UI Primitives](https://www.radix-ui.com/primitives) | Accessible unstyled Dialog, Tabs, Accordion, Popover, Toast, Tooltip — WAI-ARIA complete, focus management built in | `Modal`, `Tabs`, `Accordion`, `Notification`, `PromoPopup` |
| [Base UI](https://base-ui.com/) | Successor collaboration by Radix/MUI/Floating-UI people; same headless idea, newer API | same set as Radix |
| [Headless UI](https://headlessui.com/) | Tailwind Labs' own headless Dialog/Tabs/Disclosure/Listbox — pairs naturally with our Tailwind styling | `Modal`, `Tabs`, `Accordion`, custom `SortSelect`-style dropdowns |
| [React Aria (Adobe)](https://react-spectrum.adobe.com/react-aria/) | The most thorough a11y behaviors (hooks or components): overlays, listboxes, sliders, date pickers | any interactive control when a11y compliance is a hard requirement |

### Carousels / sliders

| Library | Notes | Would upgrade |
|---|---|---|
| [Embla Carousel](https://www.embla-carousel.com/) | Small, dependency-free, the current default choice; official React wrapper | `BannerSlider`, `ProductSlider`, `BrandSlider` |
| [keen-slider](https://keen-slider.io/) | Tiny (~5 kB), touch-first | same |
| [Swiper](https://swiperjs.com/react) | Heaviest but most featureful (thumbs-sync galleries, effects) | `ImageGallery` with synced thumbnails |

### Toasts / notifications

| Library | Notes | Would upgrade |
|---|---|---|
| [sonner](https://sonner.emilkowal.ski/) | The modern default — stacking, swipe-dismiss, promise toasts, tiny | `Notification`, `FlashMessage` (as transient toasts) |
| [react-hot-toast](https://react-hot-toast.com/) | Similar, slightly older, very stable | same |

### Media & gallery

| Library | Notes | Would upgrade |
|---|---|---|
| [yet-another-react-lightbox](https://yet-another-react-lightbox.com/) | Full-screen zoomable lightbox, plugin system (thumbnails, zoom, video) | `ImageGallery` full-screen view |
| [react-medium-image-zoom](https://github.com/rpearce/react-medium-image-zoom) | Medium-style click-to-zoom for product shots | product detail images |

### Forms & data

| Library | Notes | Complements |
|---|---|---|
| [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) | Client-side validation when checkout grows beyond native validation | `PromoCodeField`, `NewsletterForm`, checkout forms |
| [TanStack Table](https://tanstack.com/table) | Headless sortable/filterable tables | order history, admin-ish grids |
| [TanStack Virtual](https://tanstack.com/virtual) | List virtualization for very long category listings | `ProductListing` at 1000+ items |
| [nuqs](https://nuqs.dev/) | Type-safe URL search-param state for Next.js | facet/sort/pagination state (already URL-driven here) |

### Consent & misc

| Library | Notes | Would upgrade |
|---|---|---|
| [react-cookie-consent](https://github.com/Mastermindzh/react-cookie-consent) | Persistent consent banner with cookie handling built in | `CookieNotice` |
| [vaul](https://vaul.emilkowal.ski/) | Mobile bottom-sheet drawer (great for mobile filters/mini-cart) | mobile filter sidebar, `MiniCart` on small screens |
| [cmdk](https://cmdk.paco.me/) | Command-palette (⌘K) search | header search power-user mode |

### Styled component suites (bigger commitment — replaces our theming)

[shadcn/ui](https://ui.shadcn.com/) (copy-in Radix+Tailwind components — the
closest philosophical fit since the code lands in our repo, per the
"source code ownership" principle in the main README), [HeroUI](https://heroui.com/),
[Mantine](https://mantine.dev/). These bring their own design systems; adopt
only if we deliberately move off the semantic-class theming contract.

**Rule of thumb**: prefer headless (Radix/Base/Headless UI + our Tailwind)
over styled suites — it keeps THEMING.md's semantic-class contract intact and
the markup under our control, consistent with the no-layout-XML philosophy.

### daisyUI (CSS-only, no React wrapper)

[daisyUI](https://daisyui.com/) (`v5.7.16`, actively maintained, released as
recently as this check) is a pure Tailwind CSS plugin — no components, no JS,
just class names (`btn`, `card`, `modal-box`, …) — so unlike the styled
suites above, it drops straight into this project's Tailwind v4 CSS-first
setup with no build changes:

```bash
npm install -D daisyui@latest
```
```css
/* catalog.css / customer.css — right after the existing import */
@import "tailwindcss" source(none);
@plugin "daisyui";
```
Then use its classes directly in JSX (`<button className="btn btn-primary">`,
`<div className="card">`) — same zero-JS, server-safe shape as every
component in this library, no wrapper package needed:

```tsx
// no react-daisyui import — plain elements + daisyUI class names, exactly
// like every other component in this library
export default function ExampleDaisyCard({ title, href }: { title: string; href: string }) {
  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <h3 className="card-title">{title}</h3>
        <div className="card-actions justify-end">
          <a href={href} className="btn btn-primary">View</a>
        </div>
      </div>
    </div>
  );
}
```

By default daisyUI registers its own `light`/`dark` themes (its `base-*`,
`primary`, … colors), which sit alongside — not inside — this project's own
Tailwind theme tokens. Restrict or rename the ones you actually want via the
`@plugin` line's own config syntax, e.g. to keep only `light`:

```css
@plugin "daisyui" {
  themes: light --default;
}
```

The tradeoff: it's a second, parallel class vocabulary running alongside this
repo's own semantic classes (`price-tag`, `accordion-item`, …) rather than
one coherent system — same "bigger commitment" caveat as the styled suites
above, decide deliberately rather than by accident. When adopting it on a
real page, register it the same way as any library component — an `@source`
line pointing at daisyUI's own package so Tailwind scans its class names too
(daisyUI ships this automatically via the `@plugin` directive, no manual
`@source` needed for the plugin itself — only for *this project's own* `.tsx`
files that use its classes, same rule as every other adopted component here).

**`react-daisyui` (the React component wrapper) — do not use, no Tailwind v4
support has shipped and there is no committed timeline for one:**

- The latest npm release (`5.0.5`, September 2024) targets `daisyui:
  ^4.12.10` and `tailwindcss: >=3.2.7` — the Tailwind v3 generation, not what
  this project runs.
- Tailwind v4 support exists only as unfinished, unreleased work on GitHub:
  the `main` branch (last commit 2025-07-27) already bumped its peer dep to
  `daisyui: ^5.0.22` but left `tailwindcss` at the stale `>=3.2.7` range —
  inconsistent on its own, since daisyUI v5 requires Tailwind v4. Open PR
  [#490](https://github.com/daisyui/react-daisyui/pull/490) ("Updated
  DaisyUI, React, and Tailwind Deps") finishes that migration —
  `tailwindcss: ^4.2.2`, `daisyui: ^5.5.19`, `react: ^19.2.4` — but it has sat
  open with zero review activity for roughly four months.
- **There is no merge date to give** — no maintainer response, no milestone,
  no release attached to it. Re-check PR #490 before assuming this has
  changed; until it merges *and* ships an actual npm release, `react-daisyui`
  stays off the table here — use plain `daisyui` above instead.
