import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GOOGLE_PASSWORD_HELPER_TEXT,
  shouldShowGooglePasswordGuidance,
  validatePasswordPolicy,
  validatePasswordsMatch,
} from './googleAuthUtils.ts';

test('Google password helper text matches requirement exactly', () => {
  assert.equal(
    GOOGLE_PASSWORD_HELPER_TEXT,
    'This is not your Google password. Create a new password for Farm2Home.'
  );
});

test('shouldShowGooglePasswordGuidance only true for Google flow', () => {
  assert.equal(shouldShowGooglePasswordGuidance(true), true);
  assert.equal(shouldShowGooglePasswordGuidance(false), false);
  assert.equal(shouldShowGooglePasswordGuidance(undefined), false);
});

test('validatePasswordPolicy enforces strong password rules', () => {
  assert.equal(validatePasswordPolicy('Password@123').valid, true);
  assert.equal(validatePasswordPolicy('weak').valid, false);
  assert.equal(validatePasswordPolicy('NoSpecial123').valid, false);
  assert.equal(validatePasswordPolicy('no_uppercase123!').valid, false);
  assert.equal(validatePasswordPolicy('').valid, false);
});

test('validatePasswordsMatch checks password confirmation', () => {
  assert.equal(validatePasswordsMatch('Pass@123', 'Pass@123'), true);
  assert.equal(validatePasswordsMatch('Pass@123', 'Pass@124'), false);
  assert.equal(validatePasswordsMatch('', ''), false);
});
