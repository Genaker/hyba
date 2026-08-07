import InlineScript from './hyba/InlineScript';
import { initSortSelectSource } from './hyba/scripts/toolbar';
import { alpineAttrs } from '@/lib/hyva/inline';

export interface SortChoice {
  value: string;                    // "price:desc" → sort=price, dir=desc
  label: string;
}

/**
 * Sort dropdown as a GET form. The "Go" button is the no-JS fallback (still submits the same
 * form); Alpine's initSortSelect auto-submits on change and hides it — replaces the previous
 * 'use client' React version, which never hydrates on this always-zero-JS fork.
 */
export default function SortSelect({
  basePath,
  choices,
  current,
  hiddenParams,
}: {
  basePath: string;
  choices: SortChoice[];
  current: string;
  hiddenParams: [string, string][];
}) {
  return (
    <form action={basePath} {...alpineAttrs({ 'x-data': 'initSortSelect()' })} className="sorter-form flex items-center gap-2">
      {hiddenParams.map(([name, value]) => (
        <input key={name} className="sorter-param" type="hidden" name={name} value={value} />
      ))}
      <label htmlFor="sort-select" className="sorter-label text-gray-500">Sort:</label>
      <select
        id="sort-select"
        name="sort"
        defaultValue={current}
        {...alpineAttrs({ 'x-on:change': 'submit($event)' })}
        className="sorter-select rounded-lg border border-gray-300 bg-paper px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
      >
        {choices.map((choice) => (
          <option key={choice.value} className="sorter-option" value={choice.value}>{choice.label}</option>
        ))}
      </select>
      <button
        type="submit"
        x-show="false"
        className="sorter-submit rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm hover:bg-mist"
      >
        Go
      </button>
      <InlineScript code={initSortSelectSource} />
    </form>
  );
}
