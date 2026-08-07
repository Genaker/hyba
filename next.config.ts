import type { NextConfig } from "next";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { resolveThemeOverrides } from "./scripts/theme-overrides.mjs";

// Component-override mechanism — see overrides.yaml and README "Custom themes".
// @/theme/<Name> resolves to src/overrides/<Name>.tsx if present, else src/components/<Name>.tsx.
// Evaluated once at startup, same "restart to apply" model as config.yaml.
const themeOverrideAliases = resolveThemeOverrides({
  projectRoot: process.cwd(),
  overridesYamlPath: join(process.cwd(), "overrides.yaml"),
});

// config.yaml is the single source of feature flags (same file server.mjs reads).
let storefrontYaml: any = {};
try {
  storefrontYaml = parseYaml(readFileSync(join(process.cwd(), "config.yaml"), "utf8")) ?? {};
} catch {
  storefrontYaml = {};
}
const retinaEnabled = storefrontYaml.images?.retina === true;

// The 1x design sizes this app actually renders (tile 160/240, gallery 576/610,
// hero 1864). With retina off the list stops there, so a DPR-2 screen picks the
// largest 1x candidate instead of downloading a 2x image; with it on, the 2x
// widths are added back.
const oneXDeviceSizes = [378, 610, 1864];
const retinaDeviceSizes = [378, 610, 750, 1152, 1864];

const nextConfig: NextConfig = {
  // Inlined at build time so AppImage can honour the flag in client components
  // too (importing the fs-backed config there would break the client bundle).
  env: { NEXT_PUBLIC_IMAGES_RETINA: retinaEnabled ? "1" : "0" },
  compress: false,        // server.mjs gzips after stripping hydration scripts
  poweredByHeader: false,
  turbopack: {
    resolveAlias: themeOverrideAliases,
  },
  images: {
    // Bounded to the exact widths this app renders (see the 9 <Image> call
    // sites) instead of Next's default 8x8 device/image size matrix — caps
    // how many unique on-demand sharp transforms the server can be made to
    // do, since we self-host the optimizer on RAM-constrained instances.
    deviceSizes: retinaEnabled ? retinaDeviceSizes : oneXDeviceSizes,
    imageSizes: [44, 96, 120, 142, 160, 240],
    formats: ["image/webp"], // matches the existing offline pipeline's output; skips pricier AVIF encoding
    // Next 16 rejects any `q=` value not in this list (default: [75] only) — every
    // <Image>/AppImage call site in src/ uses either 75 (AppImage's default) or 70
    // (ProductTile/ProductRecommendations, tuned down for smaller PLP thumbnails).
    qualities: [70, 75],
  },
  async headers() {
    return [
      {
        // extracted demo media is immutable — new extractions produce new content
        source: "/media/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        // vanilla islands + shared libs change rarely; revalidate daily
        source: "/js/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },
};

export default nextConfig;
