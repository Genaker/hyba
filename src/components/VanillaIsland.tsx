import { preloadModule } from 'react-dom';
import { isHydratedPath } from '@/lib/hydration';

/**
 * Renders a vanilla-JS island script only on zero-JS routes.
 * On hydrated routes (HYDRATE_PATHS / KEEP_JS) React handles interactivity,
 * so nothing is emitted — no double behavior, no dead bytes.
 *
 * Islands are native ES modules: shared helpers live in /js/lib/ and are
 * imported directly by the browser (no bundler). List them in `imports` to
 * emit modulepreload hints and avoid the import-discovery waterfall.
 */
export default function VanillaIsland({
  src,
  pathname,
  imports = [],
}: {
  src: string;
  pathname: string;
  imports?: string[];
}) {
  if (isHydratedPath(pathname)) return null;
  for (const importHref of imports) preloadModule(importHref, { as: 'script' });
  return <script type="module" src={src} data-island="" />;
}
