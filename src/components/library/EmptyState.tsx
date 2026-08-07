import type { ReactNode } from 'react';

/** Centered empty-result block with an optional action link. */
export default function EmptyState({ title, message, actionHref, actionLabel, icon }: { title: string; message?: string; actionHref?: string; actionLabel?: string; icon?: ReactNode }) {
  return (
    <div className="empty-state flex flex-col items-center gap-2 py-14 text-center">
      {icon && <span aria-hidden className="empty-state-icon text-4xl text-gray-300">{icon}</span>}
      <p className="empty-state-title text-lg font-semibold text-ink">{title}</p>
      {message && <p className="empty-state-message max-w-md text-sm text-gray-500">{message}</p>}
      {actionHref && actionLabel && (
        <a href={actionHref} className="empty-state-action mt-2 rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          {actionLabel}
        </a>
      )}
    </div>
  );
}
