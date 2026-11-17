import { TFunction } from 'i18next';

export type StatusType = 'order' | 'payment' | 'verification' | 'general';

/**
 * Localizes backend order statuses without altering the raw API enum values.
 */
export const formatOrderStatus = (
  status: string | undefined | null,
  t: TFunction
): string => {
  if (!status) return t('status.pending', 'Pending');
  const upper = String(status).toUpperCase().trim();
  switch (upper) {
    case 'PENDING':
      return t('status.pending', 'Pending');
    case 'CONFIRMED':
    case 'ORDER_CONFIRMED':
      return t('status.confirmed', 'Confirmed');
    case 'PACKED':
    case 'PROCESSING':
      return t('status.packed', 'Packed');
    case 'DISPATCHED':
    case 'SHIPPED':
    case 'OUT_FOR_DELIVERY':
      return t('status.outForDelivery', 'Out for Delivery');
    case 'DELIVERED':
    case 'COMPLETED':
      return t('status.delivered', 'Delivered');
    case 'CANCELLED':
    case 'CANCELED':
      return t('status.cancelled', 'Cancelled');
    default:
      return status;
  }
};

/**
 * Localizes backend payment statuses without altering raw API enum values.
 */
export const formatPaymentStatus = (
  status: string | undefined | null,
  t: TFunction
): string => {
  if (!status) return t('status.paymentPending', 'Payment Pending');
  const upper = String(status).toUpperCase().trim();
  switch (upper) {
    case 'PAID':
    case 'SUCCESS':
    case 'COMPLETED':
      return t('status.paid', 'Paid Online');
    case 'UNPAID':
    case 'PENDING':
      return t('status.paymentPending', 'Payment Pending');
    case 'COD':
    case 'CASH_ON_DELIVERY':
      return t('checkout.cashOnDelivery', 'Cash on Delivery');
    case 'FAILED':
      return t('status.paymentFailed', 'Payment Failed');
    case 'REFUNDED':
      return t('status.refunded', 'Refunded');
    default:
      return status;
  }
};

/**
 * Localizes backend payment methods.
 */
export const formatPaymentMethod = (
  method: string | undefined | null,
  t: TFunction
): string => {
  if (!method) return t('checkout.cashOnDelivery', 'Cash on Delivery');
  const upper = String(method).toUpperCase().trim();
  if (upper.includes('COD') || upper.includes('CASH')) {
    return t('checkout.cashOnDelivery', 'Cash on Delivery (COD)');
  }
  return t('checkout.onlinePayment', 'Online Payment');
};

/**
 * Single unified helper for localizing statuses and descriptions across the app.
 * Falls back to readable version of raw value if unknown.
 */
export const statusLabel = (
  type: StatusType,
  value: string | undefined | null,
  t: TFunction
): { label: string; description?: string } => {
  if (!value) {
    return { label: t('common.optional', 'N/A') };
  }
  const upper = String(value).toUpperCase().trim();

  if (type === 'order') {
    return { label: formatOrderStatus(value, t) };
  }

  if (type === 'payment') {
    return { label: formatPaymentStatus(value, t) };
  }

  if (type === 'verification') {
    switch (upper) {
      case 'VERIFIED':
      case 'APPROVED':
        return { label: t('status.verified', 'Verified') };
      case 'REJECTED':
        return { label: t('status.rejected', 'Rejected') };
      case 'IN_REVIEW':
      case 'PENDING':
      default:
        return { label: t('status.inReview', 'In Review') };
    }
  }

  // General active/inactive
  if (upper === 'ACTIVE' || upper === 'TRUE') {
    return { label: t('status.active', 'Active') };
  }
  if (upper === 'INACTIVE' || upper === 'FALSE') {
    return { label: t('status.inactive', 'Inactive') };
  }

  // Fallback to humanized string
  const humanized = upper.replace(/_/g, ' ').toLowerCase();
  const readable = humanized.charAt(0).toUpperCase() + humanized.slice(1);
  return { label: readable };
};
