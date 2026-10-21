import test from 'node:test';
import assert from 'node:assert/strict';
import { canReuseOrder } from './orderReuseUtils.ts';
import type { AddressForm, OrderLike, CartItemLike } from './orderReuseUtils.ts';

const baseNow = 1700000000000; // Fixed timestamp for reproducible testing

const validAddressForm: AddressForm = {
  deliveryAddress: 'Flat 101, Green Acres, MG Road',
  village: 'Pune',
  postalCode: '411001',
  state: 'Maharashtra',
};

const validCartItems: CartItemLike[] = [
  {
    product: { productId: 'prod-apple-101' },
    quantity: 2,
  },
  {
    product: { productId: 'prod-banana-202' },
    quantity: 5,
  },
];

const validCartTotal = 250.0;

const createValidPendingOrder = (overrides: Partial<OrderLike> = {}): OrderLike => ({
  orderId: 'ord-uuid-12345',
  orderNumber: 'ORD-9999',
  paymentMethod: 'ONLINE',
  status: 'PENDING',
  paymentStatus: 'PENDING',
  totalAmount: 250.0,
  deliveryAddress: 'Flat 101, Green Acres, MG Road',
  village: 'Pune',
  postalCode: '411001',
  state: 'Maharashtra',
  createdOn: new Date(baseNow - 10 * 60 * 1000).toISOString(), // 10 minutes old
  items: [
    {
      productId: 'prod-apple-101',
      quantity: 2,
    },
    {
      productId: 'prod-banana-202',
      quantity: 5,
    },
  ],
  ...overrides,
});

test('1. Same cart and address reuses the order (case-insensitive & trimmed)', () => {
  const order = createValidPendingOrder({
    deliveryAddress: '  flat 101, green acres, mg road  ',
    village: 'PUNE ',
    postalCode: ' 411001',
    state: 'maharashtra ',
  });

  const canReuse = canReuseOrder(order, validCartItems, validCartTotal, validAddressForm, baseNow);
  assert.strictEqual(canReuse, true, 'Order with matching items, total, and address should be reused');
});

test('2. Changed address must NOT reuse', () => {
  const order = createValidPendingOrder({
    deliveryAddress: 'Flat 202, Blue Horizon, Park Street',
  });

  const canReuse = canReuseOrder(order, validCartItems, validCartTotal, validAddressForm, baseNow);
  assert.strictEqual(canReuse, false, 'Changed deliveryAddress must not reuse');
});

test('3. Changed PIN must NOT reuse', () => {
  const order = createValidPendingOrder({
    postalCode: '411002',
  });

  const canReuse = canReuseOrder(order, validCartItems, validCartTotal, validAddressForm, baseNow);
  assert.strictEqual(canReuse, false, 'Changed postalCode must not reuse');
});

test('4. Changed state must NOT reuse', () => {
  const order = createValidPendingOrder({
    state: 'Gujarat',
  });

  const canReuse = canReuseOrder(order, validCartItems, validCartTotal, validAddressForm, baseNow);
  assert.strictEqual(canReuse, false, 'Changed state must not reuse');
});

test('5. Changed quantity must NOT reuse', () => {
  const order = createValidPendingOrder({
    items: [
      { productId: 'prod-apple-101', quantity: 3 }, // Changed from 2 to 3
      { productId: 'prod-banana-202', quantity: 5 },
    ],
  });

  const canReuse = canReuseOrder(order, validCartItems, validCartTotal, validAddressForm, baseNow);
  assert.strictEqual(canReuse, false, 'Changed item quantity must not reuse');
});

test('6. Changed product must NOT reuse', () => {
  const order = createValidPendingOrder({
    items: [
      { productId: 'prod-orange-303', quantity: 2 }, // Different productId
      { productId: 'prod-banana-202', quantity: 5 },
    ],
  });

  const canReuse = canReuseOrder(order, validCartItems, validCartTotal, validAddressForm, baseNow);
  assert.strictEqual(canReuse, false, 'Changed productId must not reuse');
});

test('7. Changed total must NOT reuse', () => {
  const order = createValidPendingOrder({
    totalAmount: 300.0, // Different from validCartTotal (250.0)
  });

  const canReuse = canReuseOrder(order, validCartItems, validCartTotal, validAddressForm, baseNow);
  assert.strictEqual(canReuse, false, 'Changed totalAmount must not reuse');
});

test('8. Order older than 30 minutes must NOT reuse', () => {
  const order = createValidPendingOrder({
    createdOn: new Date(baseNow - 31 * 60 * 1000).toISOString(), // 31 minutes old
  });

  const canReuse = canReuseOrder(order, validCartItems, validCartTotal, validAddressForm, baseNow);
  assert.strictEqual(canReuse, false, 'Order older than 30 minutes must not reuse');
});

test('9. Order not ONLINE must NOT reuse', () => {
  const order = createValidPendingOrder({
    paymentMethod: 'COD',
  });

  const canReuse = canReuseOrder(order, validCartItems, validCartTotal, validAddressForm, baseNow);
  assert.strictEqual(canReuse, false, 'Order with non-ONLINE paymentMethod must not reuse');
});

test('10. Order not PENDING status must NOT reuse', () => {
  const order = createValidPendingOrder({
    status: 'CONFIRMED',
  });

  const canReuse = canReuseOrder(order, validCartItems, validCartTotal, validAddressForm, baseNow);
  assert.strictEqual(canReuse, false, 'Order with non-PENDING status must not reuse');
});
