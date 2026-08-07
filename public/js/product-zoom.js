// Vanilla island for the OPT-IN hover magnifier (ProductImageZoom). The zoom is
// CSS; this only makes it follow the pointer by moving `transform-origin`.
// Loaded solely on pages that enable zoom — never on the default gallery.
document.addEventListener('pointermove', (event) => {
  const frame = event.target.closest?.('[data-zoom]');
  if (!frame) return;
  const image = frame.querySelector('.product-gallery-image');
  if (!image) return;
  const bounds = frame.getBoundingClientRect();
  image.style.transformOrigin =
    `${((event.clientX - bounds.left) / bounds.width) * 100}% ${((event.clientY - bounds.top) / bounds.height) * 100}%`;
});

document.addEventListener('pointerleave', (event) => {
  event.target.closest?.('[data-zoom]')?.querySelector('.product-gallery-image')?.style.removeProperty('transform-origin');
}, true);
