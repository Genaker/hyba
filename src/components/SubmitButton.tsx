'use client';

import { useFormStatus } from 'react-dom';

/** Submit button with a native pending state; renders as a plain button without JS. */
export default function SubmitButton({
  children,
  className,
  pendingText = 'Working…',
}: {
  children: React.ReactNode;
  className: string;
  pendingText?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`action-submit ${className} disabled:cursor-wait disabled:opacity-60`}>
      {pending ? pendingText : children}
    </button>
  );
}
