/**
 * Tailwind utility classes available inside CMS-authored HTML — raw content
 * stored in each dataset's cms-pages.json (gateway/data/{oro,magento,salesforce}/)
 * and injected via dangerouslySetInnerHTML
 * (e.g. the homepage's slug:null CmsPage block, see HomePage.tsx). Tailwind's
 * scanner only sees literal class strings inside real source files at build
 * time (the `@source` lines in catalog.css/customer.css); it has no way to
 * see classes that only exist inside JSON data loaded at runtime. This file
 * exists purely to be @source'd — its only job is to contain the exact
 * strings below so Tailwind's build keeps their compiled CSS in the bundle,
 * whether or not any *.tsx file happens to also use them. Never imported by
 * app code (it's not meant to run — just to be text-scanned).
 *
 * Using a Tailwind class in CMS content that isn't listed here silently
 * renders unstyled (Tailwind never generated the CSS for it) — add it here
 * first, then use it in the JSON content.
 */
export const CMS_TAILWIND_CLASSES = `
  mx-auto my-8 mt-4 max-w-7xl px-4
  relative block absolute overflow-hidden rounded-xl rounded-lg
  grid grid-cols-1 sm:grid-cols-3 gap-4
  flex flex-col items-center justify-center justify-between text-right
  inset-x-0 inset-y-0 inset-y-6 top-0 left-6 right-6
  w-full w-64 sm:w-80 w-auto h-auto h-24 max-w-xs
  aspect-[417/664] aspect-[426/372] aspect-[415/664]
  object-cover object-contain
  bg-white/95 bg-white/90 bg-white/85 bg-brand-600 bg-amber-300
  p-4 p-5 px-5 py-2.5
  text-sm text-xs text-base text-lg sm:text-xl text-2xl font-semibold font-bold text-center
  text-white text-gray-600 text-gray-500 text-ink text-brand-600
  mt-1 mt-2 mt-4 mt-10 mb-0 mb-1
  inline-block
  text-inherit! no-underline! mt-10! mb-1! text-2xl! font-bold!
  snap-x overflow-x-auto shrink-0 inset-0 items-start items-end
  h-56 sm:h-72 lg:h-96 max-w-md sm:text-4xl drop-shadow-sm text-ink/80 sm:text-base
  bg-brand-600 hover:bg-brand-700 px-6 mt-2 bottom-3 gap-2 h-6 w-6
  h-2.5 w-2.5 rounded-full bg-ink/30 hover:bg-ink/60
  sm:text-4xl! mt-0! mb-0! mt-2! text-white!
`;
