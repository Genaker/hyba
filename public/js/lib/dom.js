// Shared vanilla helpers: tiny DOM utilities for islands.

/** querySelector shorthand with optional root. */
export function qs(selector, root = document) {
  return root.querySelector(selector);
}

/** Parses a JSON data-* attribute; returns fallback on absence or bad JSON. */
export function readJsonData(element, name, fallback = null) {
  try {
    return element?.dataset[name] ? JSON.parse(element.dataset[name]) : fallback;
  } catch {
    return fallback;
  }
}
