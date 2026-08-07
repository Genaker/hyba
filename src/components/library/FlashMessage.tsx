import type { ReactNode } from 'react';

const flashStyles = {
  success: 'border-green-200 bg-green-50 text-green-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
} as const;

/** Inline status alert (post-action feedback), colored per type. */
export default function FlashMessage({ type, children }: { type: keyof typeof flashStyles; children: ReactNode }) {
  return (
    <div role={type === 'error' ? 'alert' : 'status'} className={`flash-message flash-message-${type} rounded-lg border px-4 py-3 text-sm ${flashStyles[type]}`}>
      {children}
    </div>
  );
}
