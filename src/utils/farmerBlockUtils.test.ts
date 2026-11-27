import test from 'node:test';
import assert from 'node:assert/strict';
import { extractBlockedFarmerInfo, isAdminBlockedFarmer } from './farmerBlockUtils.ts';

test('extractBlockedFarmerInfo detects Admin block from login or /user/me payload with reason and date', () => {
  const info = extractBlockedFarmerInfo({
    role: 'FARMER',
    status: 'INACTIVE',
    blockReason: 'Fake produce photos',
    blockedUntil: '2026-12-05T00:00:00',
  });

  assert.equal(info.blocked, true);
  assert.equal(info.reason, 'Fake produce photos');
  assert.ok(info.blockedUntilText && info.blockedUntilText.includes('2026'));
});

test('isAdminBlockedFarmer ignores self-deactivated and active farmers', () => {
  assert.equal(
    isAdminBlockedFarmer({
      role: 'FARMER',
      status: 'INACTIVE',
      inactiveSource: 'SELF_DEACTIVATION',
      blockReason: null,
      blockedUntil: null,
    }),
    false
  );
  assert.equal(
    isAdminBlockedFarmer({
      role: 'FARMER',
      status: 'ACTIVE',
      isActive: true,
      blockReason: null,
      blockedUntil: null,
    }),
    false
  );
});
