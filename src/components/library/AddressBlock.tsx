import type { Address } from '@/lib/types';

/** Postal-format address lines, as on order confirmations. */
export default function AddressBlock({ address }: { address: Address }) {
  return (
    <address className="address-block text-sm not-italic leading-relaxed text-gray-600">
      <span className="address-block-name block font-medium text-ink">
        {address.firstName} {address.lastName}
      </span>
      <span className="address-block-street block">{address.street}</span>
      <span className="address-block-city block">
        {address.city}, {address.postalCode}
      </span>
      <span className="address-block-country block">{address.country}</span>
      {address.phone && <span className="address-block-phone block">{address.phone}</span>}
    </address>
  );
}
