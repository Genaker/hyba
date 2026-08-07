import AppImage from './AppImage';
import ProductImageZoom from './ProductImageZoom';

/**
 * One main-image slide, with a click-to-enlarge popup.
 *
 * Zero JavaScript: the popup is a checkbox + label pair (the same hack the
 * mobile nav uses). The checkbox, the clickable frame and the overlay are all
 * siblings *inside this slide*, so `peer-checked/zoom` scopes to this slide
 * alone — every slide carries its own popup and only the visible one is
 * reachable. The checkbox is `sr-only` rather than `hidden` so it stays
 * focusable: Tab to it, Space to open/close.
 */
export default function ProductGalleryMain({
  image,
  alt,
  index,
  priority,
  lightbox,
  zoom,
  visibilityClasses,
  zoomLabel,
  closeLabel,
}: {
  image: string;
  alt: string;
  index: number;
  priority: boolean;
  lightbox: boolean;
  /** Opt-in hover magnifier (ProductImageZoom) instead of the plain frame. */
  zoom: boolean;
  /** Per-index Tailwind classes revealing this slide when its radio is checked. */
  visibilityClasses: string;
  zoomLabel: string;
  closeLabel: string;
}) {
  const zoomId = `zoom-${alt.replace(/\W+/g, '-').toLowerCase()}-${index}`;

  const picture = (
    <AppImage
      src={image}
      alt={alt}
      width={610}
      height={610}
      displayWidth={610}
      priority={priority}
      sizes="(max-width: 767px) 360px, 576px"
      className="product-image product-gallery-image mx-auto w-full max-w-xl object-contain"
    />
  );

  const frame = zoom ? (
    <ProductImageZoom image={image} alt={alt} priority={priority} />
  ) : (
    <div className="product-gallery-frame rounded-xl border border-mist">{picture}</div>
  );

  if (!lightbox) {
    return (
      <div className={`product-gallery-slide ${visibilityClasses}`} data-gallery-slide={index}>
        {frame}
      </div>
    );
  }

  return (
    <div className={`product-gallery-slide ${visibilityClasses}`} data-gallery-slide={index}>
      <input type="checkbox" id={zoomId} className="product-gallery-zoom-toggle peer/zoom sr-only" aria-label={zoomLabel} />

      <label htmlFor={zoomId} title={zoomLabel} className="product-gallery-trigger block cursor-zoom-in peer-focus-visible/zoom:outline peer-focus-visible/zoom:outline-2 peer-focus-visible/zoom:outline-brand-600">
        {frame}
      </label>

      <div className="product-gallery-lightbox fixed inset-0 z-50 hidden items-center justify-center bg-ink/80 p-4 peer-checked/zoom:flex">
        {/* clicking anywhere outside the picture closes it */}
        <label htmlFor={zoomId} aria-label={closeLabel} className="product-gallery-lightbox-backdrop absolute inset-0 cursor-zoom-out" />
        <label htmlFor={zoomId} aria-label={closeLabel} className="product-gallery-lightbox-close absolute right-4 top-4 cursor-pointer rounded-lg bg-paper px-3 py-1.5 text-lg font-bold leading-none text-ink shadow-lg">
          ×
        </label>
        <AppImage
          src={image}
          alt={alt}
          width={1200}
          height={1200}
          displayWidth={1864}
          loading="lazy"
          sizes="(max-width: 767px) 92vw, 80vw"
          className="product-gallery-lightbox-image relative max-h-[90vh] w-auto max-w-full rounded-lg bg-paper object-contain"
        />
      </div>
    </div>
  );
}
