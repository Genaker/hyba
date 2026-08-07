import AppImage from './AppImage';

/**
 * OPT-IN hover magnifier for a gallery slide — NOT used by default (the default
 * is the click-to-enlarge popup in ProductGalleryMain, which needs no JS at all).
 * Enable per placement with `<ProductGallery zoom />`.
 *
 * The magnification itself is CSS (`scale-150` inside an overflow-hidden frame),
 * so it works with JavaScript off — it just zooms from the centre. The tiny
 * always-on island public/js/product-zoom.js upgrades it to follow the pointer
 * by moving `transform-origin`.
 */
export default function ProductImageZoom({
  image,
  alt,
  priority,
  sizes = '(max-width: 767px) 360px, 576px',
}: {
  image: string;
  alt: string;
  priority: boolean;
  sizes?: string;
}) {
  return (
    <div className="product-gallery-frame group/frame relative overflow-hidden rounded-xl border border-mist" data-zoom>
      <AppImage
        src={image}
        alt={alt}
        width={610}
        height={610}
        displayWidth={610}
        priority={priority}
        sizes={sizes}
        className="product-image product-gallery-image mx-auto w-full max-w-xl object-contain transition-transform duration-200 group-hover/frame:scale-150"
      />
    </div>
  );
}
