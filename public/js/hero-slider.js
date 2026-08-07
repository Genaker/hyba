// Vanilla hero image slider — no jQuery/Slick (the source BigCommerce store's own carousel
// dependency), no framework. Reads slides straight from the DOM (each [data-hero-slider-slide]
// child inside a [data-hero-slider] root), so it works with however many real slides a
// dataset's cms-content.json "home" block bakes in. An always-on chrome-level island (see
// storefront/CLAUDE.md "Exception — always-on islands"): this script tag is emitted directly in
// the CMS HTML rather than through VanillaIsland's zero-JS-only gate, so the slider is
// interactive under every javascript.mode, not just zero-JS routes.

const AUTOPLAY_MS = 5000; // matches the source site's own Slick `autoplaySpeed`

for (const root of document.querySelectorAll('[data-hero-slider]')) {
  const slides = [...root.querySelectorAll('[data-hero-slider-slide]')];
  if (slides.length < 2) continue;

  const prevButton = root.querySelector('[data-hero-slider-prev]');
  const nextButton = root.querySelector('[data-hero-slider-next]');
  const dotsContainer = root.querySelector('[data-hero-slider-dots]');

  const dots = slides.map((_, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'hero-slider-dot';
    dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
    dot.addEventListener('click', () => {
      show(index);
      restartAutoplay();
    });
    dotsContainer?.appendChild(dot);
    return dot;
  });

  let current = 0;
  let timer;

  function show(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.classList.toggle('hero-slider-slide--active', i === current);
      slide.setAttribute('aria-hidden', i === current ? 'false' : 'true');
    });
    dots.forEach((dot, i) => dot.classList.toggle('hero-slider-dot--active', i === current));
  }

  function restartAutoplay() {
    clearInterval(timer);
    timer = setInterval(() => show(current + 1), AUTOPLAY_MS);
  }

  prevButton?.addEventListener('click', () => {
    show(current - 1);
    restartAutoplay();
  });
  nextButton?.addEventListener('click', () => {
    show(current + 1);
    restartAutoplay();
  });
  // Pause on hover/focus — a fast auto-advance while someone's reading or about to click
  // "Shop Now" is a real usability problem, not just a nicety.
  root.addEventListener('mouseenter', () => clearInterval(timer));
  root.addEventListener('mouseleave', restartAutoplay);
  root.addEventListener('focusin', () => clearInterval(timer));
  root.addEventListener('focusout', restartAutoplay);

  show(0);
  restartAutoplay();
}
