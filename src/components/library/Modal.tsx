import type { ReactNode } from 'react';

/** CSS-only :target modal — open it with any `<a href="#{id}">`, close via the
 *  backdrop/× links (zero JS). For focus-trapping needs, upgrade to native
 *  <dialog> + a small client island, or a headless library (see README). */
export default function Modal({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <div id={id} className="modal invisible fixed inset-0 z-50 items-center justify-center opacity-0 transition-opacity target:visible target:flex target:opacity-100">
      <a href="#!" aria-label="Close" className="modal-backdrop absolute inset-0 bg-ink/50" />
      <div role="dialog" aria-modal="true" aria-label={title} className="modal-content relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-paper p-6 shadow-xl">
        <div className="modal-head flex items-center justify-between">
          <h2 className="modal-title text-lg font-bold text-ink">{title}</h2>
          <a href="#!" aria-label="Close" className="modal-close rounded p-1 text-xl leading-none text-gray-400 hover:text-ink">
            ×
          </a>
        </div>
        <div className="modal-body mt-3 text-sm text-gray-600">{children}</div>
      </div>
    </div>
  );
}
