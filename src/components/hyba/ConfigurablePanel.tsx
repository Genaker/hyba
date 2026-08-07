import InlineScript from './InlineScript';
import { initConfigurableOptionsSource } from './scripts/configurable';
import { alpineAttrs, jsonForAttribute } from '@/lib/hyva/inline';
import { buildConfigurablePanelData } from '@/lib/hyva/configurable';
import { productUrl } from '@/lib/urls';
import { storefrontConfig } from '@/lib/config';
import type { Product } from '@/lib/types';
import type { ReactNode } from 'react';

const SWATCH_TYPE_CLASS: Record<string, string> = {
  color: 'swatch-option h-9 w-9 rounded border-2 bg-cover bg-center',
  image: 'swatch-option h-9 w-9 rounded border-2 bg-cover bg-center',
  text: 'swatch-option rounded-lg border px-4 py-2 text-sm font-medium',
};

/**
 * Alpine replacement for the old React ConfigurableProductPanel (see git history) — swatch
 * selection, variant matching and the gallery it drives. Unlike the React version this renders
 * unconditionally (no `isHydratedPath` gate — Alpine works on every route on this fork).
 */
export default function ConfigurablePanel({
  product,
  rawParams,
  labels: t,
  shoppingList,
  actions,
}: {
  product: Product;
  rawParams: Record<string, string | string[] | undefined>;
  labels: {
    sku: string;
    brand: string;
    availability: string;
    inStock: string;
    outOfStock: string;
    quantity: string;
    addToCart: string;
    asLowAs: string;
    description: string;
    and: string;
    pleaseSelectPrefix: string;
    pleaseSelectSuffix: string;
    combinationUnavailable: string;
    viewImage: string;
  };
  shoppingList: ReactNode;
  actions: ReactNode;
}) {
  const data = {
    ...buildConfigurablePanelData(product, rawParams, storefrontConfig.images.retina),
    // Static JS has no access to the server-side dictionary — the validation-message
    // pieces travel in with the rest of the Alpine config (see checkBeforeSubmit).
    labels: { and: t.and, pleaseSelectPrefix: t.pleaseSelectPrefix, pleaseSelectSuffix: t.pleaseSelectSuffix, combinationUnavailable: t.combinationUnavailable, viewImage: t.viewImage },
  };

  return (
    <div
      {...alpineAttrs({ 'x-data': `initConfigurableOptions(${jsonForAttribute(data)})` })}
      className="product-info-main grid gap-10 lg:grid-cols-2"
    >
      <div className="product-media">
        <div className="configurable-gallery">
          <img
            {...alpineAttrs({ 'x-bind:src': "activeImage ? activeImage.full : ''", 'x-bind:alt': 'product.sku' })}
            className="configurable-gallery-main aspect-square w-full rounded-xl border border-mist object-contain"
          />
          <div x-show="gallery.length > 1" className="configurable-gallery-thumbs mt-3 flex flex-wrap gap-2">
            <template x-for="(shot, index) in gallery" {...alpineAttrs({ 'x-bind:key': 'shot.full' })}>
              <button
                type="button"
                {...alpineAttrs({
                  'x-on:click': 'selectThumb(index)',
                  'x-bind:class': "index === activeImageIndex ? 'border-brand-600' : 'border-transparent hover:border-mist'",
                  'x-bind:aria-label': "labels.viewImage + ' ' + (index + 1)",
                })}
                className="configurable-gallery-thumb h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2"
              >
                <img {...alpineAttrs({ 'x-bind:src': 'shot.thumb' })} alt="" className="h-full w-full object-contain" />
              </button>
            </template>
          </div>
        </div>
      </div>

      <div className="product-info-content">
        <h1 className="page-title text-3xl font-bold">{product.title}</h1>
        <dl className="product-info-sku mt-3 flex flex-wrap gap-x-8 gap-y-1 text-sm text-gray-600">
          <div className="product-info-sku-item flex gap-2">
            <dt className="product-info-label font-medium">{t.sku}:</dt>
            <dd x-text="displaySku" className="product-info-value">{product.sku}</dd>
          </div>
          {product.brand && (
            <div className="product-info-brand flex gap-2">
              <dt className="product-info-label font-medium">{t.brand}:</dt>
              <dd className="product-info-value">{product.brand}</dd>
            </div>
          )}
          <div className="product-info-stock flex gap-2">
            <dt className="product-info-label font-medium">{t.availability}:</dt>
            <dd
              {...alpineAttrs({ 'x-bind:class': "displayInStock ? 'text-brand-600' : 'text-red-600'" })}
              x-text={`displayInStock ? ${JSON.stringify(t.inStock)} : ${JSON.stringify(t.outOfStock)}`}
              className="product-info-value"
            >
              {product.inStock ? t.inStock : t.outOfStock}
            </dd>
          </div>
        </dl>

        <p x-show="displayPriceFormatted" className="price mt-5 text-3xl font-bold">
          <span x-show="showAsLowAs" x-cloak="" className="price-as-low-as mr-1.5 text-base font-medium text-gray-500">{t.asLowAs}</span>
          <span x-text="displayPriceFormatted">{data.product.priceFormatted}</span>
        </p>

        <div className="product-options mt-6 space-y-5 border-t border-mist pt-5">
          {data.axes.map((axis) => (
            <fieldset key={axis.code} className="product-option">
              <legend className="product-option-label mb-2 text-sm font-semibold">
                {axis.label} <span className="product-option-required text-red-600">*</span>
              </legend>
              <div className="product-option-values flex flex-wrap gap-2">
                {axis.options.map((option) => {
                  const isSwatch = option.swatchType === 'color' || option.swatchType === 'image';
                  const swatchStyle =
                    option.swatchType === 'color'
                      ? { backgroundColor: option.swatch ?? undefined }
                      : option.swatchType === 'image' && option.swatch
                        ? { backgroundImage: `url(${option.swatch})`, backgroundSize: 'cover' }
                        : undefined;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-label={option.value}
                      title={option.value}
                      style={swatchStyle}
                      {...alpineAttrs({
                        'x-on:click': `selectOption(${JSON.stringify(axis.code)}, ${JSON.stringify(option.value)})`,
                        'x-bind:aria-pressed': `selected[${JSON.stringify(axis.code)}] === ${JSON.stringify(option.value)}`,
                        'x-bind:disabled': `!isOptionAvailable(${JSON.stringify(axis.code)}, ${JSON.stringify(option.value)})`,
                        'x-bind:class': `(selected[${JSON.stringify(axis.code)}] === ${JSON.stringify(option.value)} ? ${JSON.stringify(
                          isSwatch ? 'border-brand-600 ring-2 ring-brand-600 ring-offset-1' : 'border-brand-600 bg-brand-50 text-brand-700',
                        )} : ${JSON.stringify(isSwatch ? 'border-gray-300' : 'border-gray-300 text-ink hover:border-gray-400')}) + (!isOptionAvailable(${JSON.stringify(axis.code)}, ${JSON.stringify(option.value)}) ? ' opacity-30 cursor-not-allowed' : '')`,
                      })}
                      className={SWATCH_TYPE_CLASS[option.swatchType]}
                    >
                      {isSwatch ? <span className="swatch-option-label sr-only">{option.value}</span> : option.value}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>

        {/* Shown only after a failed Add to Cart click attempt (checkBeforeSubmit), not
            permanently — the button itself stays clickable at all times; see the factory's
            file header comment for why (checked against the real Hyvä demo's own behavior). */}
        <p
          x-show="validationError"
          x-cloak=""
          x-text="validationError"
          role="alert"
          className="product-option-message mt-3 inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        />

        {product.inStock && (
          <>
            <form
              {...alpineAttrs({ 'x-data': 'initAddToCartForm()', 'x-on:submit.prevent': 'submitForm($event)' })}
              className="box-tocart mt-4 flex flex-wrap items-end gap-3"
            >
              <input {...alpineAttrs({ 'x-bind:value': 'displaySku' })} className="box-tocart-param" type="hidden" name="sku" defaultValue={product.sku} />
              <input className="box-tocart-param" type="hidden" name="back" value={productUrl(product)} />
              <label className="qty block text-sm">
                <span className="qty-label mb-1 block font-medium">{t.quantity}</span>
                <input
                  type="number"
                  name="quantity"
                  defaultValue={1}
                  min={1}
                  max={9999}
                  className="qty-input w-24 rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
                />
              </label>
              <button
                type="submit"
                {...alpineAttrs({ 'x-on:click': 'checkBeforeSubmit($event)' })}
                className="tocart rounded-lg bg-brand-600 px-8 py-2.5 font-semibold text-white hover:bg-brand-700"
              >
                {t.addToCart}
              </button>
            </form>
            {shoppingList}
          </>
        )}

        <div className="product-actions-extra mt-2 flex flex-wrap items-center gap-2">{actions}</div>

        {product.description && (
          <section className="product-description mt-8 border-t border-mist pt-6">
            <h2 className="product-description-title mb-2 text-lg font-semibold">{t.description}</h2>
            <div className="product-description-content rich-text text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: product.description }} />
          </section>
        )}
      </div>

      <InlineScript code={initConfigurableOptionsSource} />
    </div>
  );
}
