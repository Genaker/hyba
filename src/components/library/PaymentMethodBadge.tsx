const knownMethods: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  paypal: 'PayPal',
  invoice: 'Invoice',
  po: 'Purchase Order',
};

/** Small payment-method label chip; unknown codes render as given. */
export default function PaymentMethodBadge({ method }: { method: string }) {
  const label = knownMethods[method.toLowerCase()] ?? method;
  return <span className="payment-method-badge rounded border border-mist px-2 py-0.5 text-xs font-medium text-gray-600">{label}</span>;
}
