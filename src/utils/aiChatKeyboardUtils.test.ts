import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeAiChatScrollMetrics,
  shouldAutoScrollAiChat,
} from './aiChatKeyboardUtils.ts';

test('computeAiChatScrollMetrics keeps isNearBottom true when content fits viewport', () => {
  const metrics = computeAiChatScrollMetrics({
    contentHeight: 480,
    viewportHeight: 500,
    offsetY: 0,
  });
  assert.equal(metrics.isNearBottom, true);
  assert.equal(metrics.shouldShowScrollButton, false);
});

test('computeAiChatScrollMetrics detects user scrolled up reading history', () => {
  const metrics = computeAiChatScrollMetrics({
    contentHeight: 1600,
    viewportHeight: 600,
    offsetY: 450,
  });
  // distanceFromBottom = 1600 - (600 + 450) = 550
  assert.equal(metrics.distanceFromBottom, 550);
  assert.equal(metrics.isNearBottom, false);
  assert.equal(metrics.shouldShowScrollButton, true);
});

test('computeAiChatScrollMetrics detects user near bottom of long conversation', () => {
  const metrics = computeAiChatScrollMetrics({
    contentHeight: 1600,
    viewportHeight: 600,
    offsetY: 940,
  });
  // distanceFromBottom = 60 <= 120
  assert.equal(metrics.distanceFromBottom, 60);
  assert.equal(metrics.isNearBottom, true);
  assert.equal(metrics.shouldShowScrollButton, false);
});

test('shouldAutoScrollAiChat skips forced scroll while user reads older messages', () => {
  assert.equal(
    shouldAutoScrollAiChat({ hasPendingSubmitScroll: false, isNearBottom: false }),
    false,
  );
  assert.equal(
    shouldAutoScrollAiChat({ hasPendingSubmitScroll: true, isNearBottom: false }),
    true,
  );
  assert.equal(
    shouldAutoScrollAiChat({ hasPendingSubmitScroll: false, isNearBottom: true }),
    true,
  );
});
