/**
 * SKU typeahead for the Quick Order form. Always-on island (like mini-cart.js):
 * plain DOM + fetch against /api/sku-search, works in zero/hybrid/full JS modes.
 *
 * Everything is document-level event delegation and the dropdown is created
 * lazily on first keystroke — injecting DOM at load time breaks React
 * hydration (#418 mismatch → recovery re-render wipes injected nodes and
 * listeners). After hydration the form never re-renders, so interaction-time
 * DOM is safe, and delegation survives any node replacement regardless.
 */
const DEBOUNCE_MS = 200;
let debounceTimer = 0;
let lastQuery = '';

function suggestionsFor(field) {
  let suggestions = field.querySelector('.sku-suggestions');
  if (!suggestions) {
    suggestions = document.createElement('ul');
    suggestions.className = 'sku-suggestions';
    suggestions.hidden = true;
    field.appendChild(suggestions);
  }
  return suggestions;
}

function closeAll() {
  for (const open of document.querySelectorAll('.sku-suggestions')) {
    open.hidden = true;
    open.textContent = '';
  }
}

function render(field, results) {
  const suggestions = suggestionsFor(field);
  suggestions.textContent = '';
  if (!results.length) {
    suggestions.hidden = true;
    return;
  }
  for (const result of results) {
    const item = document.createElement('li');
    item.className = 'sku-suggestion';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'sku-suggestion-button';
    button.dataset.sku = result.sku;
    const price = result.price == null ? '' : ` — $${result.price.toFixed(2)}`;
    button.textContent = `${result.sku} — ${result.name}${price}`;
    item.appendChild(button);
    suggestions.appendChild(item);
  }
  suggestions.hidden = false;
}

document.addEventListener('input', (event) => {
  const input = event.target;
  if (!input.classList?.contains('quick-order-sku-input')) return;
  const field = input.closest('.quick-order-sku-field');
  if (!field) return;

  clearTimeout(debounceTimer);
  const query = input.value.trim();
  if (query.length < 2) return closeAll();

  debounceTimer = setTimeout(async () => {
    lastQuery = query;
    try {
      const response = await fetch(`/api/sku-search?q=${encodeURIComponent(query)}`);
      const results = await response.json();
      if (query === lastQuery) render(field, results); // stale responses lose
    } catch {
      closeAll();
    }
  }, DEBOUNCE_MS);
});

document.addEventListener('click', (event) => {
  const button = event.target.closest?.('.sku-suggestion-button');
  if (button) {
    const input = button.closest('.quick-order-sku-field')?.querySelector('.quick-order-sku-input');
    if (input) {
      input.value = button.dataset.sku;
      input.focus();
    }
    closeAll();
    return;
  }
  if (!event.target.closest?.('.quick-order-sku-field')) closeAll();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeAll();
});
