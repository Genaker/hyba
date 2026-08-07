# Custom theme overrides

Drop a file here named after a component listed in `overrides.yaml`
(project root) to override it — e.g. `src/overrides/Footer.tsx` overrides
`src/components/Footer.tsx`. Nothing else to configure; `next.config.ts`
picks it up automatically on the next restart (the same "restart to apply"
model `config.yaml` already uses).

The override's default export must match the original component's props —
it's a drop-in replacement, not a different component. To **extend** rather
than fully replace the original, import it directly by its real path
(never through `@/theme/...` — that's the aliased, swappable name):

```tsx
// src/overrides/Footer.tsx
import type { ComponentProps } from 'react';
import CoreFooter from '@/components/Footer'; // unaliased — always the real one

export default function Footer(props: ComponentProps<typeof CoreFooter>) {
  return <CoreFooter {...props} />; // wrap it, add to it, or replace it outright
}
```

For **style-only** customization you usually don't need a component override
at all: `custom.css` in this directory loads on every page and every element
ships a stable semantic class (`page-header`, `product-item`, …) to target
with plain CSS — see THEMING.md.

Empty by default (plus `custom.css`). See README.md § "Custom themes" for how
the resolution mechanism works (`scripts/theme-overrides.mjs` +
`next.config.ts`'s `turbopack.resolveAlias`).
