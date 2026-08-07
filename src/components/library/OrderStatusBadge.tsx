const statusStyles: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-brand-50 text-brand-700',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

/** Colored order-status chip; unknown statuses get the neutral style. */
export default function OrderStatusBadge({ status }: { status: string }) {
  const styles = statusStyles[status.toLowerCase()] ?? 'bg-mist text-gray-600';
  return <span className={`order-status-badge rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${styles}`}>{status}</span>;
}
