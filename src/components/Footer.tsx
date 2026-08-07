import Link from 'next/link';
import { storefrontConfig } from '@/lib/config';
import { getDictionary } from '@/lib/i18n';
import Newsletter from './hyba/Newsletter';

// Which demo dataset is actually live — kept in sync with dataProvider.provider so this
// footer never claims data it isn't showing (see config.yaml's `site`/`dataProvider` blocks).
const DATA_ATTRIBUTION: Record<string, string> = {
  'raw-oro-data': 'OroCommerce',
  oro: 'OroCommerce',
  'raw-magento-data': 'Magento (Luma sample data)',
  'raw-salesforce-data': 'Salesforce B2B Commerce (Alpine Group demo data)',
};

export default async function Footer() {
  const { footer, newsletter } = await getDictionary();
  const { name, metaDescription } = storefrontConfig.site;
  const dataAttribution = DATA_ATTRIBUTION[storefrontConfig.dataProvider.provider] ?? 'demo';

  const cmsLinks = [
    { href: '/about', label: footer.about },
    { href: '/customer-service', label: footer.customerService },
    { href: '/shipping-and-returns', label: footer.shippingReturns },
    { href: '/orders-and-returns', label: footer.ordersReturns },
    { href: '/international-shipping', label: footer.internationalShipping },
    { href: '/secure-shopping', label: footer.secureShopping },
    { href: '/privacy-policy', label: footer.privacyPolicy },
  ];

  return (
    <footer className="page-footer mt-16 border-t border-mist bg-ink text-gray-300">
      <div className="footer-content mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-4">
        <div className="footer-column">
          <p className="footer-title text-lg font-semibold text-white">{name}</p>
          <p className="footer-description mt-2 max-w-xs text-sm leading-relaxed">{metaDescription}</p>
        </div>
        <nav aria-label="Information" className="footer-column">
          <p className="footer-title mb-3 text-sm font-semibold uppercase tracking-wide text-white">{footer.information}</p>
          <ul className="footer-links space-y-2 text-sm">
            {cmsLinks.slice(0, 4).map((link) => (
              <li key={link.href} className="footer-link-item">
                <Link href={link.href} className="footer-link hover:text-white">{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Policies" className="footer-column">
          <p className="footer-title mb-3 text-sm font-semibold uppercase tracking-wide text-white">{footer.policies}</p>
          <ul className="footer-links space-y-2 text-sm">
            {cmsLinks.slice(4).map((link) => (
              <li key={link.href} className="footer-link-item">
                <Link href={link.href} className="footer-link hover:text-white">{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <Newsletter
          title={newsletter.title}
          description={newsletter.description}
          placeholder={newsletter.placeholder}
          submitLabel={newsletter.submit}
          successMessage={newsletter.success}
        />
      </div>
      <p className="footer-copyright border-t border-white/10 py-4 text-center text-xs text-gray-400">
        {footer.copyright(new Date().getFullYear(), name, dataAttribution)}
      </p>
    </footer>
  );
}
