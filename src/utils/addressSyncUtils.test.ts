import test from 'node:test';
import assert from 'node:assert';
import {
  isOrderAddressEditable,
  getOrderAddressRestrictedMessage,
  formatAddressSnapshot,
  isAddressChanged,
} from './addressSyncUtils.ts';

test('isOrderAddressEditable allows only PENDING and CONFIRMED orders', () => {
  assert.strictEqual(isOrderAddressEditable('PENDING'), true);
  assert.strictEqual(isOrderAddressEditable('pending'), true);
  assert.strictEqual(isOrderAddressEditable('CONFIRMED'), true);
  assert.strictEqual(isOrderAddressEditable('confirmed'), true);

  assert.strictEqual(isOrderAddressEditable('PACKED'), false);
  assert.strictEqual(isOrderAddressEditable('PROCESSING'), false);
  assert.strictEqual(isOrderAddressEditable('SHIPPED'), false);
  assert.strictEqual(isOrderAddressEditable('OUT_FOR_DELIVERY'), false);
  assert.strictEqual(isOrderAddressEditable('DELIVERED'), false);
  assert.strictEqual(isOrderAddressEditable('CANCELLED'), false);
  assert.strictEqual(isOrderAddressEditable(null), false);
  assert.strictEqual(isOrderAddressEditable(undefined), false);
});

test('getOrderAddressRestrictedMessage provides accurate explanations for statuses', () => {
  assert.strictEqual(getOrderAddressRestrictedMessage('PENDING'), null);
  assert.strictEqual(getOrderAddressRestrictedMessage('CONFIRMED'), null);

  const packedMsg = getOrderAddressRestrictedMessage('PACKED');
  assert.match(packedMsg || '', /packed|farmer approval/i);

  const shippedMsg = getOrderAddressRestrictedMessage('SHIPPED');
  assert.match(shippedMsg || '', /transit|dispatched/i);

  const deliveredMsg = getOrderAddressRestrictedMessage('DELIVERED');
  assert.match(deliveredMsg || '', /delivered|historical/i);

  const cancelledMsg = getOrderAddressRestrictedMessage('CANCELLED');
  assert.match(cancelledMsg || '', /cancelled|historical/i);
});

test('formatAddressSnapshot formats multi-part Indian addresses safely', () => {
  const result = formatAddressSnapshot(
    'Flat 402, Green Meadows',
    'Shivaji Nagar',
    'Maharashtra',
    '411005'
  );
  assert.strictEqual(result, 'Flat 402, Green Meadows, Shivaji Nagar, Maharashtra, 411005');

  const partial = formatAddressSnapshot('Plot 10', null, 'Maharashtra', '411001');
  assert.strictEqual(partial, 'Plot 10, Maharashtra, 411001');
});

test('isAddressChanged detects modifications case-insensitively and ignores leading/trailing spaces', () => {
  const base = {
    address: '123 Main St',
    village: 'Pune',
    state: 'Maharashtra',
    postalCode: '411001',
  };

  const same = {
    address: '  123 Main St  ',
    village: 'pune',
    state: 'MAHARASHTRA',
    postalCode: '411001',
  };
  assert.strictEqual(isAddressChanged(base, same), false);

  const changedAddress = { ...base, address: '456 MG Road' };
  assert.strictEqual(isAddressChanged(base, changedAddress), true);

  const changedPin = { ...base, postalCode: '411002' };
  assert.strictEqual(isAddressChanged(base, changedPin), true);

  const changedVillage = { ...base, village: 'Wakad' };
  assert.strictEqual(isAddressChanged(base, changedVillage), true);
});
