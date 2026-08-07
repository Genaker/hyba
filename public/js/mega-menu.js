// Vanilla-JS island: closes the catalog menu after a link is clicked.
//
// The desktop panel opens on CSS :hover (group-hover) and the mobile drawer on
// a checkbox — both survive a client-side navigation, because the pointer is
// still over the nav item and the checkbox keeps its state when the layout
// doesn't remount. So the menu would stay open on the page you just navigated
// to. Runs unconditionally (zero-JS routes too, where it's simply a no-op
// since a full page load closes everything anyway).
document.addEventListener('click', (event) => {
  const link = event.target.closest?.('.navigation a[href]');
  if (!link) return;

  // Mobile: release the drawer checkbox.
  const drawerToggle = document.getElementById('catalog-menu-toggle');
  if (drawerToggle?.checked) drawerToggle.checked = false;
  for (const submenuToggle of document.querySelectorAll('.navigation .submenu-checkbox:checked')) {
    submenuToggle.checked = false;
  }

  // Desktop: :hover can't be cleared from script, so suppress the panels until
  // the pointer actually leaves the nav (or the next keyboard focus).
  const navigation = link.closest('.navigation');
  if (!navigation) return;
  navigation.setAttribute('data-menu-suppressed', '');
  const release = () => navigation.removeAttribute('data-menu-suppressed');
  navigation.addEventListener('pointerleave', release, { once: true });
  navigation.addEventListener('focusin', release, { once: true });
});
