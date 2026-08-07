import type { ReactNode } from 'react';

export type TabItem = { label: string; content: ReactNode };

// Static peer names so Tailwind's scanner sees every class literally —
// dynamic `peer/tab-${index}` strings would silently generate no CSS.
const tabPeers = [
  { input: 'peer/tab0', label: 'peer-checked/tab0:border-brand-600 peer-checked/tab0:text-ink', panel: 'peer-checked/tab0:block' },
  { input: 'peer/tab1', label: 'peer-checked/tab1:border-brand-600 peer-checked/tab1:text-ink', panel: 'peer-checked/tab1:block' },
  { input: 'peer/tab2', label: 'peer-checked/tab2:border-brand-600 peer-checked/tab2:text-ink', panel: 'peer-checked/tab2:block' },
  { input: 'peer/tab3', label: 'peer-checked/tab3:border-brand-600 peer-checked/tab3:text-ink', panel: 'peer-checked/tab3:block' },
  { input: 'peer/tab4', label: 'peer-checked/tab4:border-brand-600 peer-checked/tab4:text-ink', panel: 'peer-checked/tab4:block' },
  { input: 'peer/tab5', label: 'peer-checked/tab5:border-brand-600 peer-checked/tab5:text-ink', panel: 'peer-checked/tab5:block' },
];

/** CSS-only tabs via hidden radios (max 6 tabs — see tabPeers). `name` must
 *  be unique per Tabs instance on a page. */
export default function Tabs({ name, tabs, defaultIndex = 0 }: { name: string; tabs: TabItem[]; defaultIndex?: number }) {
  const items = tabs.slice(0, tabPeers.length);
  return (
    <div className="tabs">
      {items.map((tab, index) => (
        <input key={tab.label} type="radio" name={name} id={`${name}-${index}`} defaultChecked={index === defaultIndex} className={`tabs-input sr-only ${tabPeers[index].input}`} />
      ))}
      <div className="tabs-list flex gap-1 border-b border-mist" role="tablist">
        {items.map((tab, index) => (
          <label key={tab.label} htmlFor={`${name}-${index}`} className={`tabs-tab cursor-pointer border-b-2 border-transparent px-4 py-2 text-sm font-medium text-gray-500 hover:text-ink ${tabPeers[index].label}`}>
            {tab.label}
          </label>
        ))}
      </div>
      {items.map((tab, index) => (
        <div key={tab.label} className={`tabs-panel hidden pt-4 ${tabPeers[index].panel}`}>
          {tab.content}
        </div>
      ))}
    </div>
  );
}
