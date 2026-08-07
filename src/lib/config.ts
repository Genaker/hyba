import 'server-only';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';

export type JsMode = 'zero' | 'hybrid' | 'full';

export interface JavascriptConfig {
  mode: JsMode;
  hydratePaths: string[];
}

export interface FontsConfig {
  enabled: boolean;
  family: string;
  stylesheet: string;
}

export interface CheckoutConfig {
  allowGuest: boolean;
}

export interface SiteConfig {
  name: string;            // short brand name — header logo alt text, <title> template suffix
  title: string;           // default <title> (root layout metadata.title.default)
  metaDescription: string;
  logoUrl: string;
  logoAlt: string;
  theme: string;           // stamps <body data-theme="…">; custom.css scopes human styles under it. '' = default look
}

export type ProviderName = 'raw-oro-data' | 'raw-magento-data' | 'raw-salesforce-data' | 'raw-shopify-data' | 'raw-shopware-data' | 'raw-bigcommerce-data' | 'oro';

const PROVIDER_NAMES: ProviderName[] = ['raw-oro-data', 'raw-magento-data', 'raw-salesforce-data', 'raw-shopify-data', 'raw-shopware-data', 'raw-bigcommerce-data', 'oro'];

export interface DataProviderConfig {
  provider: ProviderName;
  /** `oro` only — wrap it with withFallback() against raw-oro-data for gaps it can't supply (brand, slides, facets, login/session). */
  fallbackToRaw: boolean;
}

export interface ImagesConfig {
  /** Serve 2x/3x variants to HiDPI screens. Off by default — see config.yaml. */
  retina: boolean;
}

/** Reads config.yaml once; env vars (JS_MODE, HYDRATE_PATHS, DATA_PROVIDER, FALLBACK_TO_RAW) override it. */
export class StorefrontConfig {
  readonly javascript: JavascriptConfig;
  readonly fonts: FontsConfig;
  readonly images: ImagesConfig;
  readonly checkout: CheckoutConfig;
  readonly site: SiteConfig;
  readonly dataProvider: DataProviderConfig;

  constructor(configPath: string = join(process.cwd(), 'config.yaml')) {
    let raw: Record<string, any> = {};
    try {
      raw = parseYaml(readFileSync(configPath, 'utf8')) ?? {};
    } catch {
      // missing config file → defaults
    }

    const envMode = process.env.JS_MODE;
    const envPaths = process.env.HYDRATE_PATHS;
    this.javascript = {
      mode: (['zero', 'hybrid', 'full'].includes(envMode ?? '') ? envMode : raw.javascript?.mode ?? 'hybrid') as JsMode,
      hydratePaths: envPaths
        ? envPaths.split(',').map((prefix) => prefix.trim()).filter(Boolean)
        : raw.javascript?.hydratePaths ?? [],
    };

    this.fonts = {
      enabled: raw.fonts?.enabled === true,
      family: raw.fonts?.family ?? '',
      stylesheet: raw.fonts?.stylesheet ?? '',
    };

    this.images = {
      retina: raw.images?.retina === true,
    };

    this.checkout = {
      allowGuest: raw.checkout?.allowGuest === true,
    };

    this.site = {
      name: raw.site?.name ?? 'Demo B2B',
      title: raw.site?.title ?? 'Demo B2B — Industrial, Medical & Office Supplies',
      metaDescription: raw.site?.metaDescription ?? 'Modern headless storefront: industrial, medical and office supplies with B2B pricing.',
      logoUrl: raw.site?.logoUrl ?? '/logo.svg',
      logoAlt: raw.site?.logoAlt ?? 'Demo B2B',
      theme: process.env.THEME ?? raw.site?.theme ?? '',
    };

    const envProvider = process.env.DATA_PROVIDER;
    const envFallback = process.env.FALLBACK_TO_RAW;
    this.dataProvider = {
      provider: (PROVIDER_NAMES.includes(envProvider as ProviderName) ? envProvider : raw.dataProvider?.provider ?? 'raw-oro-data') as ProviderName,
      fallbackToRaw: envFallback !== undefined ? envFallback === 'true' : raw.dataProvider?.fallbackToRaw !== false,
    };
  }

  /** Does this route keep React hydration scripts? */
  isHydratedPath(pathname: string): boolean {
    if (this.javascript.mode === 'full') return true;
    if (this.javascript.mode === 'zero') return false;
    return this.javascript.hydratePaths.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
  }
}

export const storefrontConfig = new StorefrontConfig();
