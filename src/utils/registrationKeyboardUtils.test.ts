import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeFocusedInputScrollY,
  getRegistrationScrollBottomPadding,
} from './registrationKeyboardUtils.ts';

test('computeFocusedInputScrollY scrolls down when input is covered by keyboard', () => {
  const targetY = computeFocusedInputScrollY({
    scrollY: 120,
    scrollViewTop: 0,
    scrollViewHeight: 800,
    inputTop: 620,
    inputHeight: 44,
    windowHeight: 800,
    keyboardHeight: 320,
  });
  // visibleBottom = 480; desiredBottom = 620 + 44 + 42 = 706; delta = 226 -> 120 + 226 = 346
  assert.equal(targetY, 346);
});

test('computeFocusedInputScrollY uses tighter keyboardScreenY boundary when reported', () => {
  const targetY = computeFocusedInputScrollY({
    scrollY: 50,
    scrollViewTop: 20,
    scrollViewHeight: 800,
    inputTop: 500,
    inputHeight: 40,
    windowHeight: 850,
    keyboardHeight: 310,
    keyboardScreenY: 520,
  });
  // fallbackKeyboardTop = 540, keyboardScreenY = 520 -> visibleBottom = 520
  // desiredBottom = 500 + 40 + 42 = 582; delta = 62 -> 50 + 62 = 112
  assert.equal(targetY, 112);
});

test('computeFocusedInputScrollY returns null when focused input is already visible', () => {
  const targetY = computeFocusedInputScrollY({
    scrollY: 100,
    scrollViewTop: 0,
    scrollViewHeight: 500,
    inputTop: 200,
    inputHeight: 44,
    windowHeight: 800,
    keyboardHeight: 300,
  });
  assert.equal(targetY, null);
});

test('computeFocusedInputScrollY scrolls up when focused input is above visible top', () => {
  const targetY = computeFocusedInputScrollY({
    scrollY: 300,
    scrollViewTop: 40,
    scrollViewHeight: 460,
    inputTop: 48,
    inputHeight: 44,
    windowHeight: 800,
    keyboardHeight: 300,
  });
  // desiredTop = 48 - 32 = 16 < 40 -> delta = 24 -> 300 - 24 = 276
  assert.equal(targetY, 276);
});

test('computeFocusedInputScrollY returns null when keyboard is closed', () => {
  assert.equal(
    computeFocusedInputScrollY({
      scrollY: 0,
      scrollViewTop: 0,
      scrollViewHeight: 800,
      inputTop: 650,
      inputHeight: 44,
      windowHeight: 800,
      keyboardHeight: 0,
    }),
    null,
  );
});

test('getRegistrationScrollBottomPadding expands cleanly while keyboard is visible', () => {
  assert.equal(getRegistrationScrollBottomPadding(0), 44);
  assert.equal(getRegistrationScrollBottomPadding(310), 346);
});
