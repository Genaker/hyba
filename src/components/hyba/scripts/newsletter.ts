/**
 * Footer newsletter signup — UI-only (no backend endpoint exists for this demo, matching its
 * scope): client-side email validation, then an optimistic success message. `@submit.prevent`
 * means it's inert without JS (no backend to submit to anyway); the email input's own
 * `type="email"`/`required` still give basic native validation feedback in that case.
 */
export const initNewsletterFormSource = `
window.initNewsletterForm ??= function () {
  return {
    submitted: false,
    submit(event) {
      if (!event.target.checkValidity()) {
        event.target.reportValidity();
        return;
      }
      this.submitted = true;
    },
  };
};
`;
