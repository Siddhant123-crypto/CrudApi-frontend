/**
 * Utility functions for Customer Address Synchronization and Order Status Eligibility.
 */

export const EDITABLE_ORDER_STATUSES = ['PENDING', 'CONFIRMED'] as const;

export const isOrderAddressEditable = (status?: string | null): boolean => {
  if (!status) return false;
  const upper = status.toUpperCase().trim();
  return upper === 'PENDING' || upper === 'CONFIRMED';
};

export const getOrderAddressRestrictedMessage = (status?: string | null): string | null => {
  if (!status) return null;
  const upper = status.toUpperCase().trim();

  switch (upper) {
    case 'PENDING':
    case 'CONFIRMED':
      return null;
    case 'PROCESSING':
    case 'PACKED':
      return 'Order is already packed or being prepared. Address changes require farmer approval.';
    case 'OUT_FOR_DELIVERY':
    case 'SHIPPED':
      return 'Order has already been dispatched and is in transit. Delivery address cannot be modified.';
    case 'DELIVERED':
      return 'This order has already been delivered. Historical delivery addresses cannot be changed.';
    case 'CANCELLED':
      return 'This order was cancelled. Historical delivery addresses cannot be changed.';
    default:
      return 'Address editing is not available for this order status.';
  }
};

export const formatAddressSnapshot = (
  address?: string | null,
  village?: string | null,
  state?: string | null,
  postalCode?: string | null
): string => {
  const parts: string[] = [];
  if (address && address.trim()) parts.push(address.trim());
  if (village && village.trim()) parts.push(village.trim());
  if (state && state.trim()) parts.push(state.trim());
  if (postalCode && postalCode.trim()) parts.push(postalCode.trim());
  return parts.join(', ');
};

export const isAddressChanged = (
  oldAddress: { address?: string | null; village?: string | null; state?: string | null; postalCode?: string | null },
  newAddress: { address?: string | null; village?: string | null; state?: string | null; postalCode?: string | null }
): boolean => {
  const norm = (s?: string | null) => (s || '').trim().toLowerCase();
  return (
    norm(oldAddress.address) !== norm(newAddress.address) ||
    norm(oldAddress.village) !== norm(newAddress.village) ||
    norm(oldAddress.state) !== norm(newAddress.state) ||
    norm(oldAddress.postalCode) !== norm(newAddress.postalCode)
  );
};
