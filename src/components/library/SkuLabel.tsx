/** "SKU: WS12" secondary label. */
export default function SkuLabel({ sku }: { sku: string }) {
  return <span className="sku-label text-xs uppercase tracking-wide text-gray-500">SKU: {sku}</span>;
}
