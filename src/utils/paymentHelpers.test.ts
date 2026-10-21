import test from 'node:test';
import assert from 'node:assert/strict';
import { PAYMENT_MESSAGES } from '../constants/paymentMessages.ts';
import {
  isRazorpayTestKey,
  sanitizeContact,
  sanitizeEmail,
  shortenId,
  formatPaymentDateTime,
} from './paymentFormatUtils.ts';

test('isRazorpayTestKey correctly detects test keys', () => {
  assert.equal(isRazorpayTestKey('rzp_test_123456789'), true);
  assert.equal(isRazorpayTestKey('rzp_live_123456789'), false);
  assert.equal(isRazorpayTestKey(''), false);
  assert.equal(isRazorpayTestKey(undefined), false);
});

test('sanitizeContact formats 10-digit Indian phone numbers', () => {
  assert.equal(sanitizeContact('+91 9876543210'), '9876543210');
  assert.equal(sanitizeContact('919876543210'), '9876543210');
  assert.equal(sanitizeContact('98765-43210'), '9876543210');
  assert.equal(sanitizeContact('12345'), undefined);
  assert.equal(sanitizeContact('abcd'), undefined);
  assert.equal(sanitizeContact(undefined), undefined);
});

test('sanitizeEmail validates clean email strings', () => {
  assert.equal(sanitizeEmail('test@example.com'), 'test@example.com');
  assert.equal(sanitizeEmail(' user@domain.in '), 'user@domain.in');
  assert.equal(sanitizeEmail('invalid-email'), undefined);
  assert.equal(sanitizeEmail(undefined), undefined);
});

test('PAYMENT_MESSAGES constants are clean English sentences', () => {
  assert.equal(PAYMENT_MESSAGES.PAYMENT_CANCELLED, 'Payment was cancelled. You can try again anytime.');
  assert.equal(PAYMENT_MESSAGES.PAYMENT_FAILED, 'Payment failed. Please try again.');
  assert.equal(PAYMENT_MESSAGES.ALREADY_PAID, 'This order is already paid.');
  assert.equal(PAYMENT_MESSAGES.NOT_YOUR_ORDER, 'This order does not belong to your account.');
  assert.equal(PAYMENT_MESSAGES.ORDER_NOT_FOUND, 'Order not found.');
});

test('shortenId shortens long payment IDs cleanly', () => {
  assert.equal(shortenId('pay_1234567890abcdef123456'), 'pay_1234...123456');
  assert.equal(shortenId('short_id'), 'short_id');
  assert.equal(shortenId(undefined), 'N/A');
});

test('formatPaymentDateTime formats valid and fallback date strings safely', () => {
  const result = formatPaymentDateTime('2026-10-13T10:00:00Z');
  assert.equal(typeof result, 'string');
  assert.ok(result.length > 5);

  const fallback = formatPaymentDateTime(undefined);
  assert.equal(typeof fallback, 'string');
  assert.ok(fallback.length > 5);
});
