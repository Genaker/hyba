import type { ReactNode } from 'react';

export type AccordionItem = { title: string; content: ReactNode };

/** Native <details> accordion — `exclusive` uses the details `name` attribute
 *  so the browser itself closes the others (zero JS). */
export default function Accordion({ items, exclusive = false, name = 'accordion', defaultOpenIndex }: { items: AccordionItem[]; exclusive?: boolean; name?: string; defaultOpenIndex?: number }) {
  return (
    <div className="accordion divide-y divide-mist rounded-xl border border-mist">
      {items.map((item, index) => (
        <details key={item.title} name={exclusive ? name : undefined} open={index === defaultOpenIndex} className="accordion-item group">
          <summary className="accordion-title flex cursor-pointer items-center justify-between px-4 py-3 font-medium text-ink hover:bg-mist/50">
            {item.title}
            <span aria-hidden className="accordion-chevron text-gray-400 transition-transform group-open:rotate-180">⌄</span>
          </summary>
          <div className="accordion-content px-4 pb-4 text-sm text-gray-600">{item.content}</div>
        </details>
      ))}
    </div>
  );
}
