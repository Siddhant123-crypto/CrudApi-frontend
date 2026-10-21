export interface AddressForm {
  deliveryAddress?: string;
  address?: string;
  village: string;
  postalCode: string;
  state: string;
}

export interface CartItemLike {
  productId?: string;
  quantity: number;
  product?: {
    productId?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface OrderItemLike {
  productId?: string;
  quantity?: number;
  [key: string]: any;
}

export interface OrderLike {
  orderId?: string;
  orderNumber?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  status?: string;
  createdOn?: string;
  totalAmount?: number | string;
  deliveryAddress?: string;
  village?: string;
  postalCode?: string;
  state?: string;
  items?: OrderItemLike[];
  [key: string]: any;
}

export const parseCreatedTime = (createdStr?: string): number => {
  if (!createdStr) return 0;
  if (typeof createdStr === 'string') {
    // If it has timezone indicator (Z or offset), parse directly
    if (createdStr.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(createdStr)) {
      const parsed = new Date(createdStr).getTime();
      if (!isNaN(parsed)) return parsed;
    }
    // If it's a Spring Boot LocalDateTime string like "2026-10-12T16:00:00"
    if (createdStr.includes('T')) {
      const [datePart, timePart] = createdStr.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hours, minutes, seconds] = timePart.split(':').map((p) => parseFloat(p));
      return new Date(year, month - 1, day, hours, minutes, Math.floor(seconds || 0)).getTime();
    }
    const parsed = new Date(createdStr).getTime();
    return !isNaN(parsed) ? parsed : 0;
  }
  return 0;
};

/**
 * Pure helper to decide whether an existing pending unpaid ONLINE order
 * can be safely reused for the current checkout form and cart.
 *
 * Requirements:
 * - Payment method must be ONLINE
 * - Status must be PENDING
 * - Payment status must be PENDING or FAILED
 * - Created within the last 30 minutes
 * - Total amount matches cart total (abs diff < 0.01)
 * - Item count matches cart item count
 * - Delivery address fields match current form (case-insensitive & trimmed)
 * - Same set of (productId, quantity) pairs
 */
export const canReuseOrder = (
  order: OrderLike | null | undefined,
  cartItems: CartItemLike[] | null | undefined,
  cartTotal: number,
  addressForm: AddressForm,
  now: number = Date.now()
): boolean => {
  if (!order) return false;
  if (!Array.isArray(cartItems) || cartItems.length === 0) return false;

  // 1. Payment method must be ONLINE
  if (order.paymentMethod !== 'ONLINE') {
    return false;
  }

  // 2. Status must be PENDING
  if (order.status !== 'PENDING') {
    return false;
  }

  // 3. Payment status must be PENDING or FAILED
  if (order.paymentStatus !== 'PENDING' && order.paymentStatus !== 'FAILED') {
    return false;
  }

  // 4. Created within the last 30 minutes
  const createdTime = parseCreatedTime(order.createdOn);
  if (!createdTime || isNaN(createdTime)) {
    return false;
  }
  const diffMs = now - createdTime;
  const thirtyMinutesMs = 30 * 60 * 1000;
  if (diffMs < 0 || diffMs > thirtyMinutesMs) {
    return false;
  }

  // 5. Total amount comparison (abs difference < 0.01)
  const orderTotal = Number(order.totalAmount || 0);
  const expectedTotal = Number(cartTotal || 0);
  if (isNaN(orderTotal) || isNaN(expectedTotal) || Math.abs(orderTotal - expectedTotal) >= 0.01) {
    return false;
  }

  // 6. Address fields check (case-insensitive, trimmed comparison)
  if (
    typeof order.deliveryAddress !== 'string' ||
    typeof order.village !== 'string' ||
    typeof order.postalCode !== 'string' ||
    typeof order.state !== 'string'
  ) {
    return false;
  }

  const formDeliveryAddress = (addressForm.deliveryAddress || addressForm.address || '').trim().toLowerCase();
  const formVillage = (addressForm.village || '').trim().toLowerCase();
  const formPostalCode = (addressForm.postalCode || '').trim().toLowerCase();
  const formState = (addressForm.state || '').trim().toLowerCase();

  const orderDeliveryAddress = order.deliveryAddress.trim().toLowerCase();
  const orderVillage = order.village.trim().toLowerCase();
  const orderPostalCode = order.postalCode.trim().toLowerCase();
  const orderState = order.state.trim().toLowerCase();

  if (
    orderDeliveryAddress !== formDeliveryAddress ||
    orderVillage !== formVillage ||
    orderPostalCode !== formPostalCode ||
    orderState !== formState
  ) {
    return false;
  }

  // 7. Item count check
  if (!Array.isArray(order.items) || order.items.length !== cartItems.length) {
    return false;
  }

  // 8. Items validation & (productId, quantity) pairs check
  const currentItemList = cartItems.map((item) => ({
    productId: String(item.product?.productId || item.productId || ''),
    quantity: Number(item.quantity || 0),
  }));

  for (const item of currentItemList) {
    if (!item.productId || isNaN(item.quantity) || item.quantity <= 0) {
      return false;
    }
  }

  for (const item of order.items) {
    if (!item.productId || item.quantity === undefined || item.quantity === null || isNaN(Number(item.quantity))) {
      return false;
    }
  }

  const existingItemList = order.items.map((item) => ({
    productId: String(item.productId || ''),
    quantity: Number(item.quantity || 0),
  }));

  currentItemList.sort((a, b) => a.productId.localeCompare(b.productId) || a.quantity - b.quantity);
  existingItemList.sort((a, b) => a.productId.localeCompare(b.productId) || a.quantity - b.quantity);

  for (let i = 0; i < currentItemList.length; i++) {
    if (currentItemList[i].productId !== existingItemList[i].productId) {
      return false;
    }
    if (Math.abs(currentItemList[i].quantity - existingItemList[i].quantity) > 0.0001) {
      return false;
    }
  }

  return true;
};
