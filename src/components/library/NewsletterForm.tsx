/** Email capture form; posts to `action`. */
export default function NewsletterForm({ action, buttonLabel = 'Subscribe' }: { action: string; buttonLabel?: string }) {
  return (
    <form action={action} method="post" className="newsletter-form flex gap-2">
      <input
        type="email"
        name="email"
        required
        placeholder="Enter your email address"
        className="newsletter-input flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
      <button type="submit" className="newsletter-submit rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
        {buttonLabel}
      </button>
    </form>
  );
}
