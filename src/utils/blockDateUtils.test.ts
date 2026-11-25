import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseBlockDate,
  isValidBlockUntilDate,
  calculateBlockDurationDays,
} from './blockDateUtils.ts';

const refNow = new Date(2026, 10, 25, 15, 50, 0); // 25 Nov 2026, 3:50 PM

test('accepts today date 25/11/2026 (exact screenshot scenario) and returns 1 day', () => {
  assert.equal(isValidBlockUntilDate('25/11/2026', refNow), true);
  assert.equal(calculateBlockDurationDays('25/11/2026', refNow), 1);
});

test('accepts future dates in DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY, YYYY-MM-DD, 2-digit year, and spaces', () => {
  assert.equal(isValidBlockUntilDate('30-11-2026', refNow), true);
  assert.equal(calculateBlockDurationDays('30-11-2026', refNow), 5);

  assert.equal(isValidBlockUntilDate('30.11.2026', refNow), true);
  assert.equal(isValidBlockUntilDate('2026-11-30', refNow), true);
  assert.equal(isValidBlockUntilDate('30/11/26', refNow), true);
  assert.equal(isValidBlockUntilDate(' 30 / 11 / 2026 ', refNow), true);
  assert.equal(isValidBlockUntilDate('30112026', refNow), true);
});

test('rejects past dates and impossible calendar dates', () => {
  assert.equal(isValidBlockUntilDate('24/11/2026', refNow), false);
  assert.equal(isValidBlockUntilDate('31/02/2026', refNow), false);
  assert.equal(isValidBlockUntilDate('31/11/2026', refNow), false);
  assert.equal(isValidBlockUntilDate('', refNow), false);
  assert.equal(parseBlockDate('abc'), null);
});
