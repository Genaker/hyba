import ProductGalleryMain from './ProductGalleryMain';
import ProductGalleryThumbs from './ProductGalleryThumbs';
import type { Product } from '@/lib/types';

/**
 * Product image gallery — main image + thumbnail picker + magnification.
 *
 * Architecture, in line with the repo's zero-JS-first rule:
 *  - Switching is CSS-only: one hidden radio per image, and each slide/thumb
 *    reveals itself via `peer-checked/<n>` — so the picker works with no client
 *    JS at all (same mechanism as the library's Tabs component).
 *  - Because Tailwind's scanner needs *literal* class strings, the peer names
 *    live in a static table below; that caps the gallery at MAX_SLIDES images
 *    (extras are dropped, which is the honest trade for keeping it JS-free).
 *  - Clicking the main image opens a full-screen popup — also pure CSS (a
 *    checkbox + label per slide, see ProductGalleryMain); the only JS is a
 *    3-line island adding Escape-to-close.
 *  - Hover magnification is NOT default: pass `zoom` to swap the frame for
 *    ProductImageZoom (opt-in, its own component + island).
 *  - The pieces are separate components (this composition root, GalleryMain,
 *    GalleryThumbs) so a theme can override just one — see overrides.yaml.
 */

// Raised from 6 once variant galleries landed (magento products reach 12 shots);
// each slide needs its own static peer entry below.
const MAX_SLIDES = 8;

// Static per-index class strings — dynamic `peer-checked/g${i}` would generate no CSS.
const SLIDE_PEERS = [
  { input: 'peer/g0', slide: 'hidden peer-checked/g0:block', thumb: 'peer-checked/g0:border-brand-600' },
  { input: 'peer/g1', slide: 'hidden peer-checked/g1:block', thumb: 'peer-checked/g1:border-brand-600' },
  { input: 'peer/g2', slide: 'hidden peer-checked/g2:block', thumb: 'peer-checked/g2:border-brand-600' },
  { input: 'peer/g3', slide: 'hidden peer-checked/g3:block', thumb: 'peer-checked/g3:border-brand-600' },
  { input: 'peer/g4', slide: 'hidden peer-checked/g4:block', thumb: 'peer-checked/g4:border-brand-600' },
  { input: 'peer/g5', slide: 'hidden peer-checked/g5:block', thumb: 'peer-checked/g5:border-brand-600' },
  { input: 'peer/g6', slide: 'hidden peer-checked/g6:block', thumb: 'peer-checked/g6:border-brand-600' },
  { input: 'peer/g7', slide: 'hidden peer-checked/g7:block', thumb: 'peer-checked/g7:border-brand-600' },
];

export default function ProductGallery({
  product,
  /** Overrides gallery[0] — the configurable-product panel passes the selected variant's shot. */
  activeImage,
  /** Replaces the product's gallery entirely (a selected variant's own shots). */
  images,
  /** Click-to-enlarge popup (pure CSS) — the default interaction. */
  lightbox = true,
  /** Opt-in hover magnifier (ProductImageZoom + its island). Off by default. */
  zoom = false,
  /** Popup a11y labels — passed in (not read from the dictionary) so this stays
   *  a sync, dependency-free component usable from the client panel too. */
  zoomLabel = 'Enlarge image',
  closeLabel = 'Close image',
}: {
  product: Product;
  activeImage?: string | null;
  images?: string[];
  lightbox?: boolean;
  zoom?: boolean;
  zoomLabel?: string;
  closeLabel?: string;
}) {
  const fallback = [product.imageLarge ?? product.image].filter(Boolean) as string[];
  const source = images?.length ? images : product.gallery?.length ? product.gallery : fallback;
  // A selected variant's image leads, then the rest of the gallery.
  const ordered = activeImage ? [activeImage, ...source.filter((image) => image !== activeImage)] : source;
  const slides = ordered.slice(0, MAX_SLIDES);

  if (slides.length === 0) {
    return <div aria-hidden className="product-image-placeholder aspect-square w-full rounded-xl bg-mist" />;
  }

  // Unique per product so two galleries on one page never share radio state.
  const namePrefix = `gallery-${product.id}`;
  // Keyed by the image set: a variant switch must reset the picker to slide 0
  // rather than leaving a stale radio checked for a different set of shots.
  const setKey = images?.join("|") ?? "default";

  return (
    <div key={setKey} className="product-gallery" data-product-gallery={product.id}>
      {slides.map((image, index) => (
        <input
          key={image}
          type="radio"
          name={namePrefix}
          id={`${namePrefix}-${index}`}
          defaultChecked={index === 0}
          className={`product-gallery-input sr-only ${SLIDE_PEERS[index].input}`}
          aria-label={`Show image ${index + 1}`}
        />
      ))}

      {slides.map((image, index) => (
        <ProductGalleryMain
          key={image}
          image={image}
          alt={product.title}
          index={index}
          priority={index === 0}
          lightbox={lightbox}
          zoom={zoom}
          visibilityClasses={SLIDE_PEERS[index].slide}
          zoomLabel={zoomLabel}
          closeLabel={closeLabel}
        />
      ))}

      {/* Minimum vanilla, loaded only when the feature needs it: Escape-to-close
          for the popup, pointer-tracking only when zoom is opted into. */}
      {lightbox && <script type="module" src="/js/gallery-lightbox.js" data-island="" />}
      {zoom && <script type="module" src="/js/product-zoom.js" data-island="" />}

      <ProductGalleryThumbs
        images={slides}
        namePrefix={namePrefix}
        activeClasses={slides.map((_, index) => `border-transparent hover:border-mist ${SLIDE_PEERS[index].thumb}`)}
        alt={product.title}
      />
    </div>
  );
}
