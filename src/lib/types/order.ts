/**
 * A shipping/billing address, entered fresh at checkout (no saved address
 * book yet).
 *
 * @example
 * { "firstName": "Amanda", "lastName": "Cole", "street": "1 Main St", "city": "Springfield", "postalCode": "12345", "country": "United States", "phone": "555-0100" }
 */
export interface Address {
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
}

/**
 * A placed order, persisted to the demo JSON order store. `id` follows
 * `ORD-{year}-{seq}`; `paymentTerm` is currently always the single Net 30
 * option offered at checkout. `shippingMethod`/`paymentTerm` are stable keys, not
 * display text — a placed order must still render correctly if the viewer's locale
 * changes later, so the display string is resolved from `dictionary.checkout` at
 * render time (see checkout/confirmation/page.tsx, account/page.tsx), never frozen
 * into the stored order.
 *
 * @see https://ucp.dev/2026-04-08/specification/order/ — UCP Order capability (item unitPrice/totalPrice naming follows it)
 * @see https://ucp.dev/2026-04-08/specification/checkout/ — UCP Checkout (its line_items carry the selected variant, mirrored by selectedOptions)
 *
 * @example
 * {
 *   "id": "ORD-2026-0001",
 *   "email": "AmandaRCole@example.org",
 *   "createdAt": "2026-07-23T10:15:00.000Z",
 *   "items": [
 *     { "sku": "WSH12-28-Green", "name": "Erika Running Short", "quantity": 10, "unitPrice": 45, "totalPrice": 450, "selectedOptions": [{ "label": "Color", "value": "Green" }, { "label": "Size", "value": "28" }] }
 *   ],
 *   "shippingAddress": { "firstName": "Amanda", "lastName": "Cole", "street": "1 Main St", "city": "Springfield", "postalCode": "12345", "country": "United States", "phone": "555-0100" },
 *   "shippingMethod": "free",
 *   "paymentTerm": "net30",
 *   "subtotal": 450,
 *   "shipping": 0,
 *   "total": 450,
 *   "currency": "USD"
 * }
 */
export interface Order {
  id: string;                       // "ORD-2026-0001"
  email: string;
  createdAt: string;                // ISO 8601
  items: {
    sku: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    selectedOptions: { label: string; value: string }[]; // [] for a simple product
  }[];
  shippingAddress: Address;
  shippingMethod: 'free' | 'flat';
  paymentTerm: 'net30';
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
}
