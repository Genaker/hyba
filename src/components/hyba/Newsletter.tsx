import InlineScript from './InlineScript';
import { initNewsletterFormSource } from './scripts/newsletter';
import { alpineAttrs } from '@/lib/hyva/inline';

export default function Newsletter({ title, description, placeholder, submitLabel, successMessage }: {
  title: string;
  description: string;
  placeholder: string;
  submitLabel: string;
  successMessage: string;
}) {
  return (
    <div {...alpineAttrs({ 'x-data': 'initNewsletterForm()' })} className="newsletter footer-column">
      <p className="newsletter-title mb-1 text-sm font-semibold uppercase tracking-wide text-white">{title}</p>
      <p className="newsletter-description mb-3 text-sm text-gray-400">{description}</p>

      <form {...alpineAttrs({ 'x-on:submit.prevent': 'submit($event)', 'x-show': '!submitted' })} className="newsletter-form flex gap-2">
        <label htmlFor="newsletter-email" className="newsletter-label sr-only">{placeholder}</label>
        <input
          id="newsletter-email"
          type="email"
          name="email"
          required
          placeholder={placeholder}
          className="newsletter-input w-full min-w-0 rounded-lg border border-white/20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-white focus:outline-none"
        />
        <button type="submit" className="newsletter-submit shrink-0 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-gray-200">
          {submitLabel}
        </button>
      </form>

      <p x-show="submitted" x-cloak="" className="newsletter-success text-sm font-medium text-white">
        {successMessage}
      </p>

      <InlineScript code={initNewsletterFormSource} />
    </div>
  );
}
