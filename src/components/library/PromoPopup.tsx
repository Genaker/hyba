import type { ReactNode } from 'react';

/** Promo overlay shown on render, dismissed with a CSS-only checkbox. Visual
 *  dismiss only — gate rendering on a server-side cookie to persist it. */
export default function PromoPopup({ title, children, dismissLabel = 'No thanks' }: { title: string; children: ReactNode; dismissLabel?: string }) {
  return (
    <div className="promo-popup-wrapper">
      <input type="checkbox" id="promo-popup-dismiss" className="promo-popup-checkbox peer sr-only" />
      <div className="promo-popup fixed inset-0 z-50 flex items-center justify-center peer-checked:hidden">
        <label htmlFor="promo-popup-dismiss" aria-label="Dismiss" className="promo-popup-backdrop absolute inset-0 cursor-pointer bg-ink/50" />
        <div role="dialog" aria-label={title} className="promo-popup-content relative z-10 w-full max-w-md rounded-xl bg-paper p-6 text-center shadow-xl">
          <h2 className="promo-popup-title text-xl font-bold text-ink">{title}</h2>
          <div className="promo-popup-body mt-2 text-sm text-gray-600">{children}</div>
          <label htmlFor="promo-popup-dismiss" className="promo-popup-dismiss mt-4 inline-block cursor-pointer text-sm text-gray-500 underline hover:text-ink">
            {dismissLabel}
          </label>
        </div>
      </div>
    </div>
  );
}
