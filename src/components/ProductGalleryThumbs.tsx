import AppImage from './AppImage';

/**
 * Thumbnail strip. Each thumb is a <label> bound to its slide's radio — no JS,
 * no state: clicking one checks the radio that ProductGallery's CSS uses to
 * reveal the matching main image. Rendered by ProductGallery, which owns the
 * radios and the peer-class table.
 */
export default function ProductGalleryThumbs({
  images,
  namePrefix,
  activeClasses,
  alt,
}: {
  images: string[];
  namePrefix: string;
  /** Per-index Tailwind classes marking the checked thumb (see ProductGallery). */
  activeClasses: string[];
  alt: string;
}) {
  if (images.length < 2) return null;   // a single shot needs no picker
  return (
    <ul className="product-gallery-thumbs mt-3 flex gap-2 overflow-x-auto" aria-label={`${alt} images`}>
      {images.map((image, index) => (
        <li key={image} className="product-gallery-thumb-item shrink-0">
          <label
            htmlFor={`${namePrefix}-${index}`}
            className={`product-gallery-thumb block cursor-pointer rounded-lg border-2 p-0.5 transition-colors ${activeClasses[index]}`}
          >
            <AppImage
              src={image}
              alt={`${alt} — view ${index + 1}`}
              width={80}
              height={80}
              displayWidth={96}
              loading="lazy"
              sizes="80px"
              className="product-gallery-thumb-image h-16 w-16 rounded-md object-contain"
            />
            <span className="sr-only">{`View ${index + 1}`}</span>
          </label>
        </li>
      ))}
    </ul>
  );
}
