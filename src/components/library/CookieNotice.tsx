/** Cookie banner with a CSS-only dismiss (checkbox hack). The dismissal is
 *  visual-only for this render — persist it by pointing `acceptAction` at a
 *  server action that sets a consent cookie and re-renders without the banner. */
export default function CookieNotice({ message = 'We use cookies to improve your experience.', policyHref = '/privacy-policy', acceptAction }: { message?: string; policyHref?: string; acceptAction?: string }) {
  const acceptButton = (
    <button type={acceptAction ? 'submit' : undefined} className="cookie-notice-accept rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
      Got it
    </button>
  );
  return (
    <div className="cookie-notice-wrapper">
      <input type="checkbox" id="cookie-notice-dismiss" className="cookie-notice-checkbox peer sr-only" />
      <div className="cookie-notice fixed inset-x-0 bottom-0 z-50 border-t border-mist bg-paper p-4 shadow-[0_-8px_24px_-12px_rgb(0_0_0/0.2)] peer-checked:hidden">
        <div className="cookie-notice-content mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <p className="cookie-notice-message text-sm text-gray-600">
            {message}{' '}
            <a href={policyHref} className="cookie-notice-policy text-brand-600 underline">
              Learn more
            </a>
          </p>
          {acceptAction ? (
            <form action={acceptAction} method="post" className="cookie-notice-form">{acceptButton}</form>
          ) : (
            <label htmlFor="cookie-notice-dismiss" className="cookie-notice-dismiss cursor-pointer rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              Got it
            </label>
          )}
        </div>
      </div>
    </div>
  );
}
