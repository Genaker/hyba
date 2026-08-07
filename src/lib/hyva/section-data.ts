import 'server-only';
import { getCartLines, cartSubtotal } from '../cart';
import { getSessionUser } from '../session';
import { readWishlist } from '../wishlist';
import { readCompare } from '../compare';
import { formatMoney } from '../format';
import { productUrlWithOptions } from '../urls';
import { storefrontConfig } from '../config';
import { nextImageUrl } from './next-image-url';

export interface CustomerSectionsPayload {
  cart: {
    items: {
      sku: string;
      title: string;
      url: string;
      image: string | null;
      quantity: number;
      unitPriceFormatted: string;
      totalPriceFormatted: string;
      options: { label: string; value: string }[];
    }[];
    count: number;
    subtotalFormatted: string;
  };
  customer: { firstName: string } | null;
  wishlist: { count: number };
  compare: { count: number };
}

/**
 * Server-computed snapshot of everything the Alpine header/cart-drawer need — mirrors
 * Magento/Hyvä's "customer section data" pattern so the client never re-derives cart/pricing
 * logic itself. `public/js/hyva/bootstrap.mjs` fetches this on load and after every mutation
 * (the `reload-customer-section-data` event) and dispatches it as `private-content-loaded`.
 */
export async function buildCustomerSections(): Promise<CustomerSectionsPayload> {
  const [lines, user, wishlistItems, compareItems] = await Promise.all([
    getCartLines(),
    getSessionUser(),
    readWishlist(),
    readCompare(),
  ]);
  const subtotal = cartSubtotal(lines);

  return {
    cart: {
      items: lines.map((line) => ({
        sku: line.product.sku,
        title: line.product.title,
        url: productUrlWithOptions(line.product, line.selectedOptions),
        image: line.product.image ? nextImageUrl(line.product.image, 96, 75, storefrontConfig.images.retina) : null,
        quantity: line.quantity,
        unitPriceFormatted: formatMoney(line.unitPrice),
        totalPriceFormatted: formatMoney(line.totalPrice),
        options: line.selectedOptions,
      })),
      count: lines.reduce((sum, line) => sum + line.quantity, 0),
      subtotalFormatted: formatMoney(subtotal),
    },
    customer: user ? { firstName: user.firstName } : null,
    wishlist: { count: wishlistItems.length },
    compare: { count: compareItems.length },
  };
}
