import type { ReactNode } from 'react';

const notificationStyles = {
  success: 'border-green-300', error: 'border-red-300', warning: 'border-amber-300', info: 'border-blue-300',
} as const;

/** Fixed toast-style notice with a CSS-only dismiss. Server-rendered (e.g.
 *  after a form action redirect); for stacking/auto-dismiss use a toast
 *  library (see README). `id` must be unique per notification on a page. */
export default function Notification({ id, type, children }: { id: string; type: keyof typeof notificationStyles; children: ReactNode }) {
  return (
    <div className="notification-wrapper">
      <input type="checkbox" id={`${id}-dismiss`} className="notification-checkbox peer sr-only" />
      <div className={`notification notification-${type} fixed right-4 top-4 z-50 flex w-80 items-start gap-2 rounded-xl border-l-4 bg-paper p-4 shadow-lg peer-checked:hidden ${notificationStyles[type]}`} role="status">
        <div className="notification-body flex-1 text-sm text-ink">{children}</div>
        <label htmlFor={`${id}-dismiss`} aria-label="Dismiss" className="notification-dismiss cursor-pointer leading-none text-gray-400 hover:text-ink">
          ×
        </label>
      </div>
    </div>
  );
}
