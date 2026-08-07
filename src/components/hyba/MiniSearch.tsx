import InlineScript from './InlineScript';
import { initMiniSearchSource } from './scripts/mini-search';
import { alpineAttrs } from '@/lib/hyva/inline';

/**
 * Header quick search — replaces the original SearchAutocomplete.tsx ('use client', assumes
 * React hydration) on this fork, which never hydrates. The `<form>` GET to /product/search is
 * the zero-JS path (works with Alpine disabled too); Alpine's initMiniSearch progressively
 * enhances it with a debounced suggestions dropdown. Photo/voice search dropped for v1 — see
 * the fork plan's Phase 2 notes.
 */
export default function MiniSearch({ searchLabel, placeholder, submitLabel }: {
  searchLabel: string;
  placeholder: string;
  submitLabel: string;
}) {
  return (
    <div
      {...alpineAttrs({ 'x-data': 'initMiniSearch()', 'x-on:keydown.escape': 'close()' })}
      className="mini-search relative flex-1 sm:max-w-sm"
    >
      <form action="/product/search" role="search" aria-label={searchLabel} className="mini-search-form flex">
        <input
          type="search"
          name="search"
          {...alpineAttrs({
            'x-model': 'query',
            'x-on:input': 'onInput()',
            'x-on:focus': 'query.trim().length >= 3 && (isOpen = suggestions.length > 0)',
            'x-on:keydown.down.prevent': 'moveActive(1)',
            'x-on:keydown.up.prevent': 'moveActive(-1)',
            'x-on:keydown.enter': 'activeIndex >= 0 && ($event.preventDefault(), openActive())',
          })}
          autoComplete="off"
          placeholder={placeholder}
          className="mini-search-input w-full rounded-l-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
        <button type="submit" className="mini-search-submit rounded-r-lg border border-l-0 border-gray-300 bg-mist px-3 text-sm font-medium hover:bg-gray-200">
          {submitLabel}
        </button>
      </form>

      <ul
        x-show="isOpen"
        x-cloak=""
        {...alpineAttrs({ 'x-on:click.outside': 'close()' })}
        className="mini-search-suggestions absolute inset-x-0 top-full z-30 mt-1 max-h-96 overflow-y-auto rounded-lg border border-mist bg-paper py-1 shadow-xl"
      >
        <template x-for="(suggestion, index) in suggestions" {...alpineAttrs({ 'x-bind:key': 'suggestion.sku' })}>
          <li className="mini-search-suggestion">
            <a
              {...alpineAttrs({
                'x-bind:href': 'suggestion.url',
                'x-bind:class': "index === activeIndex ? 'bg-mist' : ''",
              })}
              className="mini-search-suggestion-link flex items-center gap-3 px-3 py-2 text-sm hover:bg-mist"
            >
              <img
                {...alpineAttrs({ 'x-bind:src': "suggestion.image || ''" })}
                x-show="suggestion.image"
                alt=""
                className="mini-search-suggestion-image h-9 w-9 shrink-0 rounded border border-mist object-contain"
              />
              <span x-text="suggestion.name" className="mini-search-suggestion-name min-w-0 flex-1 truncate" />
            </a>
          </li>
        </template>
      </ul>

      <InlineScript code={initMiniSearchSource} />
    </div>
  );
}
