import type { ReactNode } from 'react';

type ContainerSize = 'md' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '7xl';

const maxWidths: Record<ContainerSize, string> = {
  md: 'max-w-md',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '7xl': 'max-w-7xl',
};

/** Page-width wrapper — `size` mirrors Tailwind's own max-w-* scale so every page keeps its existing width, just without a hand-rolled div. */
export default function Container({ size = '7xl', className = '', children }: { size?: ContainerSize; className?: string; children: ReactNode }) {
  return <div className={`container-block mx-auto ${maxWidths[size]} px-4 ${className}`}>{children}</div>;
}
