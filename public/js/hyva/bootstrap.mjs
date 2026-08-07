// Alpine bootstrap — the one script every page loads (data-island, survives zero-JS
// stripping in server.mjs). Defines window.hyvaLike (small helpers, Hyvä's `window.hyva`
// equivalent), runs the customer-section-data loop (Magento/Hyvä's own pattern: cart/wishlist/
// compare state travels as one fetched JSON blob, broadcast as a window event so any component
// can read it without prop-drilling), then starts Alpine. Runs after every window.init* factory
// is already defined, since factories are classic (parser-executed) inline <script>s and this
// file is a deferred module — see src/components/hyva/InlineScript.tsx.
import Alpine from '/js/vendor/alpine.mjs';
import { formatMoney } from '/js/lib/money.js';

function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`${url} responded ${response.status}`);
  return response.json();
}

function dispatch(name, detail) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

let sectionData = null;

async function loadSections() {
  const response = await fetch('/api/customer-sections', { headers: { accept: 'application/json' } });
  const data = await response.json();
  sectionData = data;
  dispatch('private-content-loaded', { data });
  return data;
}

window.hyvaLike = {
  formatMoney,
  getCookie,
  postJson,
  dispatch,
  reloadSections: loadSections,
  get sectionData() {
    return sectionData;
  },
};

window.addEventListener('reload-customer-section-data', () => {
  loadSections().catch((error) => console.error('[hyva] failed to reload customer sections', error));
});

loadSections().catch((error) => console.error('[hyva] failed to load customer sections', error));

window.Alpine = Alpine;
Alpine.start();
