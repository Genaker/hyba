export type BannerSlide = { id: string; image: string; alt?: string; title?: string; text?: string; href?: string; cta?: string };

/** CSS-only banner carousel — scroll-snap track + anchor dots, zero JS
 *  (same pattern as the homepage hero slider). */
export default function BannerSlider({ slides, idPrefix = 'banner' }: { slides: BannerSlide[]; idPrefix?: string }) {
  if (slides.length === 0) return null;
  return (
    <section className="banner-slider relative">
      <div className="banner-slider-track flex snap-x snap-mandatory overflow-x-auto scroll-smooth">
        {slides.map((slide) => (
          <div key={slide.id} id={`${idPrefix}-${slide.id}`} className="banner-slide relative w-full shrink-0 snap-start">
            <img src={slide.image} alt={slide.alt ?? ''} className="banner-slide-image h-48 w-full object-cover sm:h-64" />
            {(slide.title || slide.text) && (
              <div className="banner-slide-content absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                {slide.title && <h3 className="banner-slide-title text-xl font-bold text-white drop-shadow">{slide.title}</h3>}
                {slide.text && <p className="banner-slide-text mt-1 text-sm text-white/90 drop-shadow">{slide.text}</p>}
                {slide.href && slide.cta && (
                  <a href={slide.href} className="banner-slide-cta mt-3 rounded-lg bg-paper px-4 py-2 text-sm font-semibold text-ink">
                    {slide.cta}
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {slides.length > 1 && (
        <nav aria-label="Banners" className="banner-slider-dots absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-2">
          {slides.map((slide) => (
            <a key={slide.id} href={`#${idPrefix}-${slide.id}`} aria-label={`Go to banner ${slide.id}`} className="banner-slider-dot flex h-5 w-5 items-center justify-center">
              <span aria-hidden className="banner-slider-dot-marker h-2 w-2 rounded-full bg-white/60 hover:bg-white" />
            </a>
          ))}
        </nav>
      )}
    </section>
  );
}
