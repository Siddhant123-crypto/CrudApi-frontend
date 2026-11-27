import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeAdminOrderTab,
  filterAdminOrders,
  filterAdminProducts,
  normalizeDashboardSummary,
} from './adminDashboardUtils.ts';

test('normalizeAdminOrderTab maps dashboard card params cleanly', () => {
  assert.equal(normalizeAdminOrderTab('Pending'), 'Pending');
  assert.equal(normalizeAdminOrderTab('Processing'), 'Pending');
  assert.equal(normalizeAdminOrderTab('Completed'), 'Delivered');
  assert.equal(normalizeAdminOrderTab('Delivered'), 'Delivered');
  assert.equal(normalizeAdminOrderTab('Cancelled'), 'Cancelled');
  assert.equal(normalizeAdminOrderTab(undefined), 'All');
});

test('filterAdminOrders matches Pending across all non-terminal order statuses and searches customer/id', () => {
  const sampleOrders = [
    { orderId: 'aaaa1111-0000', customerName: 'Ramesh', orderStatus: 'PENDING', orderDate: '2026-11-27T10:00:00Z' },
    { orderId: 'bbbb2222-0000', customerName: 'Suresh', orderStatus: 'CONFIRMED', orderDate: '2026-11-27T10:05:00Z' },
    { orderId: 'cccc3333-0000', customerName: 'Mahesh', orderStatus: 'SHIPPED', orderDate: '2026-11-27T10:10:00Z' },
    { orderId: 'dddd4444-0000', customerName: 'Barry Van', orderStatus: 'CANCELLED', orderDate: '2026-11-27T09:00:00Z' },
    { orderId: 'eeee5555-0000', customerName: 'Anita', orderStatus: 'DELIVERED', orderDate: '2026-11-27T08:00:00Z' },
  ];

  assert.equal(filterAdminOrders(sampleOrders, 'All').length, 5);
  assert.equal(filterAdminOrders(sampleOrders, 'Pending').length, 3);
  assert.equal(filterAdminOrders(sampleOrders, 'Delivered').length, 1);
  assert.equal(filterAdminOrders(sampleOrders, 'Cancelled').length, 1);
  assert.equal(filterAdminOrders(sampleOrders, 'All', 'barry').length, 1);
  assert.equal(filterAdminOrders(sampleOrders, 'Pending', '#ORD-BBBB2').length, 1);
});

test('filterAdminProducts shows both active and inactive products in All tab while excluding deleted items', () => {
  const sampleProducts = [
    { productName: 'Tomato', farmerName: 'Ram', isActive: true, isDelete: false, status: 'ACTIVE' },
    { productName: 'Onion', farmerName: 'Shyam', isActive: false, isDelete: false, status: 'INACTIVE' },
    { productName: 'Old Potato', farmerName: 'Ram', isActive: false, isDelete: true, status: 'DELETED' },
  ];

  assert.equal(filterAdminProducts(sampleProducts, 'All').length, 2);
  assert.equal(filterAdminProducts(sampleProducts, 'Active').length, 1);
  assert.equal(filterAdminProducts(sampleProducts, 'Inactive').length, 1);
});

test('normalizeDashboardSummary coerces numeric dashboard stats safely', () => {
  const normalized = normalizeDashboardSummary({
    totalFarmers: 18,
    totalCustomers: '24',
    totalProducts: 12,
    totalOrders: 9,
    pendingOrders: 3,
    completedOrders: 4,
    cancelledOrders: 2,
    totalRevenue: 1250,
    recentOrders: null,
  });

  assert.equal(normalized.totalFarmers, 18);
  assert.equal(normalized.totalCustomers, 24);
  assert.equal(normalized.pendingOrders + normalized.completedOrders + normalized.cancelledOrders, 9);
  assert.deepEqual(normalized.recentOrders, []);
});
