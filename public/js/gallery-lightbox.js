// Minimum vanilla: Escape closes the product-image popup. The popup itself is
// pure CSS (a checkbox + label per slide, see ProductGalleryMain) — clicking the
// backdrop or × already closes it without any JS; this only adds the keyboard
// affordance browsers can't express in CSS.
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  for (const toggle of document.querySelectorAll('.product-gallery-zoom-toggle:checked')) toggle.checked = false;
});
