/** Auto-submits the sort-select's form on change — the "Go" button stays the no-JS fallback. */
export const initSortSelectSource = `
window.initSortSelect ??= function () {
  return {
    submit(event) {
      event.target.form.requestSubmit();
    },
  };
};
`;
