import { formatMoney } from '../format';
import { slugifyOptionLabel } from '../urls';
import { nextImageUrl } from './next-image-url';
import type { Product, ProductVariant } from '../types';

type VariantOptionMeta = ProductVariant['options'][number];

export interface ConfigurableImage {
  full: string;
  thumb: string;
}

export interface ConfigurablePanelAxis {
  code: string;
  label: string;
  slug: string; // slugifyOptionLabel(label) — the ?param= key, precomputed since the Alpine
  // factory is static JS with no access to the TS helper.
  options: { value: string; swatchType: VariantOptionMeta['swatchType']; swatch: string | null }[];
}

export interface ConfigurablePanelVariant {
  sku: string;
  options: Record<string, string>;
  image: ConfigurableImage | null;
  gallery: ConfigurableImage[];
  priceFormatted: string | null;
  inStock: boolean;
}

export interface ConfigurablePanelData {
  axes: ConfigurablePanelAxis[];
  variants: ConfigurablePanelVariant[];
  preselect: Record<string, string>;
  // True when at least two variants are priced differently — the "As low as: $X" prefix
  // (real Magento/Hyvä price-box convention) only makes sense when there's an actual range;
  // a configurable product whose variants all cost the same just shows the plain price.
  hasPriceRange: boolean;
  product: {
    sku: string;
    image: ConfigurableImage | null;
    gallery: ConfigurableImage[];
    priceFormatted: string | null;
    inStock: boolean;
  };
}

function toImage(src: string, retina: boolean): ConfigurableImage {
  return { full: nextImageUrl(src, 610, 75, retina), thumb: nextImageUrl(src, 96, 75, retina) };
}

/**
 * Server-computed data for the Alpine configurable-options panel (scripts/configurable.ts) —
 * the axes/variants derivation ConfigurableProductPanel.tsx (the old React version, removed on
 * this fork) used to compute client-side, moved server-side since the factory is static JS.
 * `rawParams` restores the URL-encoded selection (?color=red&size=m) exactly like the old
 * panel's `useSearchParams()` read — same `slugifyOptionLabel(axis.label)` key contract as
 * `productUrlWithOptions()` in src/lib/urls.ts. `retina` is the caller's
 * `storefrontConfig.images.retina` — threaded in rather than read here so this stays a pure,
 * `server-only`-free function (unit-tested directly, see tests/unit/hyva-configurable.test.ts).
 */
export function buildConfigurablePanelData(
  product: Product,
  rawParams: Record<string, string | string[] | undefined>,
  retina = false,
): ConfigurablePanelData {
  const seenAxes = new Map<string, string>();
  for (const variant of product.variants) {
    for (const option of variant.options) if (!seenAxes.has(option.code)) seenAxes.set(option.code, option.label);
  }

  const axes: ConfigurablePanelAxis[] = [...seenAxes].map(([code, label]) => {
    const seenValues = new Map<string, VariantOptionMeta>();
    for (const variant of product.variants) {
      const match = variant.options.find((option) => option.code === code);
      if (match && !seenValues.has(match.value)) seenValues.set(match.value, match);
    }
    return {
      code,
      label,
      slug: slugifyOptionLabel(label),
      options: [...seenValues.values()].map((option) => ({ value: option.value, swatchType: option.swatchType, swatch: option.swatch ?? null })),
    };
  });

  const variants: ConfigurablePanelVariant[] = product.variants.map((variant) => ({
    sku: variant.sku,
    options: Object.fromEntries(variant.options.map((option) => [option.code, option.value])),
    image: variant.image ? toImage(variant.image, retina) : null,
    gallery: variant.gallery.filter(Boolean).map((image) => toImage(image, retina)),
    priceFormatted: variant.price !== null ? formatMoney(variant.price) : null,
    inStock: variant.inStock,
  }));

  const preselect: Record<string, string> = {};
  for (const axis of axes) {
    const paramValue = rawParams[axis.slug];
    const value = Array.isArray(paramValue) ? paramValue[0] : paramValue;
    if (value && axis.options.some((option) => option.value === value)) preselect[axis.code] = value;
  }

  const distinctPrices = new Set(product.variants.map((variant) => variant.price).filter((price) => price !== null));
  const hasPriceRange = distinctPrices.size > 1;

  const baseImage = product.imageLarge ?? product.image;
  return {
    axes,
    variants,
    preselect,
    hasPriceRange,
    product: {
      sku: product.sku,
      image: baseImage ? toImage(baseImage, retina) : null,
      gallery: product.gallery.filter(Boolean).map((image) => toImage(image, retina)),
      priceFormatted: product.prices[0] ? formatMoney(product.prices[0].amount) : null,
      inStock: product.inStock,
    },
  };
}
