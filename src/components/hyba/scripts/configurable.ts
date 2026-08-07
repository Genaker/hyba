/**
 * Alpine replacement for the old React ConfigurableProductPanel — swatch selection, variant
 * matching, and the gallery it drives, all in one scope (they're tightly coupled: picking a
 * swatch changes the image, price, SKU and stock status together, so splitting this into
 * separate islands would only add event-wiring for no real benefit). \`config\` is
 * ConfigurablePanelData (see src/lib/hyva/configurable.ts) — axes/variants/preselect/product,
 * every image pre-resolved to a \`/_next/image\` URL server-side.
 *
 * Gallery rule (verified against a real Luma PDP, see the old panel's own comment): selecting a
 * variant PREPENDS that variant's own shots to the product's gallery — it never replaces them.
 *
 * Add to Cart stays clickable at all times rather than disabled until a full selection is made
 * (checked against the real Hyvä demo: it does the same — a disabled button with no explanation
 * is worse UX than a clickable one that tells you exactly what's missing on attempt).
 * \`validationError\` holds that message, shown only after a failed click, not permanently.
 */
export const initConfigurableOptionsSource = `
window.initConfigurableOptions ??= function (config) {
  return {
    axes: config.axes,
    variants: config.variants,
    product: config.product,
    hasPriceRange: config.hasPriceRange,
    labels: config.labels,
    selected: Object.assign({}, config.preselect),
    activeImageIndex: 0,
    validationError: null,
    get allSelected() {
      return this.axes.length > 0 && this.axes.every((axis) => this.selected[axis.code]);
    },
    get matchedVariant() {
      if (!this.allSelected) return null;
      const selected = this.selected;
      return this.variants.find((variant) => this.axes.every((axis) => variant.options[axis.code] === selected[axis.code])) || null;
    },
    get partialMatchVariant() {
      const chosenAxes = this.axes.filter((axis) => this.selected[axis.code]);
      if (chosenAxes.length === 0) return null;
      const selected = this.selected;
      return this.variants.find((variant) => chosenAxes.every((axis) => variant.options[axis.code] === selected[axis.code])) || null;
    },
    get activeVariant() {
      return this.matchedVariant || this.partialMatchVariant;
    },
    get displaySku() {
      return this.activeVariant ? this.activeVariant.sku : this.product.sku;
    },
    get displayPriceFormatted() {
      return (this.activeVariant && this.activeVariant.priceFormatted) || this.product.priceFormatted;
    },
    get showAsLowAs() {
      return this.hasPriceRange && !this.matchedVariant;
    },
    get displayInStock() {
      return this.activeVariant ? this.activeVariant.inStock : this.product.inStock;
    },
    get gallery() {
      const variant = this.activeVariant;
      const shots = variant
        ? [variant.image].concat(variant.gallery, this.product.gallery)
        : [this.product.image].concat(this.product.gallery);
      const seenFulls = new Set();
      const unique = [];
      for (const shot of shots) {
        if (shot && !seenFulls.has(shot.full)) {
          seenFulls.add(shot.full);
          unique.push(shot);
        }
      }
      return unique;
    },
    get activeImage() {
      const gallery = this.gallery;
      return gallery[this.activeImageIndex] || gallery[0] || null;
    },
    isOptionAvailable(axisCode, value) {
      const trial = Object.assign({}, this.selected, {});
      trial[axisCode] = value;
      return this.variants.some(
        (variant) => variant.inStock && Object.keys(trial).every((code) => variant.options[code] === trial[code]),
      );
    },
    selectOption(axisCode, value) {
      const next = Object.assign({}, this.selected);
      next[axisCode] = value;
      this.selected = next;
      this.activeImageIndex = 0;
      this.validationError = null;
      this.syncUrl();
    },
    selectThumb(index) {
      this.activeImageIndex = index;
    },
    // Runs on the Add to Cart button's click, before the form's own submit fires — stays
    // clickable at all times (see the file header comment); this only blocks the click and
    // surfaces a message when the selection is genuinely incomplete or invalid.
    checkBeforeSubmit(event) {
      if (this.allSelected && this.matchedVariant && this.matchedVariant.inStock) {
        this.validationError = null;
        return;
      }
      event.preventDefault();
      if (!this.allSelected) {
        const missing = this.axes.filter((axis) => !this.selected[axis.code]).map((axis) => axis.label);
        this.validationError = this.labels.pleaseSelectPrefix + missing.join(' ' + this.labels.and + ' ') + this.labels.pleaseSelectSuffix;
      } else {
        this.validationError = this.labels.combinationUnavailable;
      }
    },
    syncUrl() {
      const params = new URLSearchParams();
      for (const axis of this.axes) {
        if (this.selected[axis.code]) params.set(axis.slug, this.selected[axis.code]);
      }
      const queryString = params.toString();
      const url = window.location.pathname + (queryString ? '?' + queryString : '');
      window.history.replaceState(null, '', url);
    },
  };
};
`;
