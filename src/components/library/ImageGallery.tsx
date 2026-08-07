export type GalleryImage = { src: string; alt: string };

/** Product image gallery — scroll-snap main track + thumbnail anchors that
 *  scroll it, zero JS (same mechanism as the hero slider's dots). */
export default function ImageGallery({ images, idPrefix = 'gallery' }: { images: GalleryImage[]; idPrefix?: string }) {
  if (images.length === 0) return null;
  return (
    <div className="image-gallery">
      <div className="image-gallery-track flex snap-x snap-mandatory overflow-x-auto scroll-smooth rounded-xl">
        {images.map((image, index) => (
          <img key={image.src} id={`${idPrefix}-${index}`} src={image.src} alt={image.alt} className="image-gallery-main aspect-square w-full shrink-0 snap-start object-cover" />
        ))}
      </div>
      {images.length > 1 && (
        <div className="image-gallery-thumbs mt-2 flex gap-2 overflow-x-auto">
          {images.map((image, index) => (
            <a key={image.src} href={`#${idPrefix}-${index}`} className="image-gallery-thumb shrink-0 rounded-lg border border-mist hover:border-brand-500">
              <img src={image.src} alt="" className="h-16 w-16 rounded-lg object-cover" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
