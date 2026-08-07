// Mirrors next.config.ts's imageSizes/deviceSizes/qualities exactly — Next 16
// rejects any `w=`/`q=` combination outside these whitelists.
const IMAGE_SIZES = [44, 96, 120, 142, 160, 240];
const ONE_X_DEVICE_SIZES = [378, 610, 1864];
const RETINA_DEVICE_SIZES = [378, 610, 750, 1152, 1864];

function nearestAllowedWidth(width: number, retina: boolean): number {
  const deviceSizes = retina ? RETINA_DEVICE_SIZES : ONE_X_DEVICE_SIZES;
  const allowed = [...IMAGE_SIZES, ...deviceSizes].sort((a, b) => a - b);
  return allowed.find((candidate) => candidate >= width) ?? allowed[allowed.length - 1];
}

/**
 * Builds a `/_next/image` URL for images an Alpine factory swaps in client-side (gallery
 * thumbnails, cart-drawer lines, …) — same optimizer AppImage.tsx uses. These URLs are always
 * precomputed server-side (never assembled in the browser) so they can't drift from the
 * whitelist above. `retina` is threaded in by the caller (`storefrontConfig.images.retina`)
 * rather than read from config here — this keeps the module a pure function with no
 * `server-only` dependency, so callers like buildConfigurablePanelData stay unit-testable under
 * plain `node:test` (no fs/cookies access, unlike `../config`).
 */
export function nextImageUrl(src: string, width: number, quality: 70 | 75 = 75, retina = false): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${nearestAllowedWidth(width, retina)}&q=${quality}`;
}
