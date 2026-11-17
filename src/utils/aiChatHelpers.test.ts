import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_SUGGESTION_CHIPS,
  getFollowUpSuggestions,
  getChatClearedKey,
  getDeletedMessagesKey,
  formatAiError,
} from './aiChatHelpers.ts';

test('INITIAL_SUGGESTION_CHIPS contains exact 4 requested questions', () => {
  assert.equal(INITIAL_SUGGESTION_CHIPS.length, 4);
  assert.deepEqual(INITIAL_SUGGESTION_CHIPS, [
    'Tamatar kab lagana chahiye?',
    'Pyaz ke patte sukh rahe hain',
    'Tamatar mein keede lag gaye hain',
    'Kitna urea daalun?',
  ]);
});

test('getFollowUpSuggestions generates contextual follow-ups for tomato questions', () => {
  const followUps = getFollowUpSuggestions('Mere tamatar ke paudhe ke patte peele ho rahe hain, kya karun?');
  assert.equal(followUps.length, 2);
  assert.equal(followUps[0], 'Tamatar kab lagana chahiye?');
  assert.equal(followUps[1], 'Tamatar mein rog se bachav ke upay?');
});

test('getFollowUpSuggestions generates contextual follow-ups for onion questions', () => {
  const followUps = getFollowUpSuggestions('Pyaz ke patte sukh rahe hain');
  assert.equal(followUps.length, 2);
  assert.ok(followUps[0].toLowerCase().includes('pyaz'));
});

test('getFollowUpSuggestions generates contextual follow-ups for fertilizer/khad questions', () => {
  const followUps = getFollowUpSuggestions('Kitna urea daalun?');
  assert.equal(followUps.length, 2);
  assert.ok(followUps[0].toLowerCase().includes('khad') || followUps[0].toLowerCase().includes('kvk'));
});

test('getFollowUpSuggestions falls back gracefully when question is generic or undefined', () => {
  const followUps = getFollowUpSuggestions(undefined);
  assert.equal(followUps.length, 2);
  assert.ok(followUps[0].length > 0);
  assert.ok(followUps[1].length > 0);
});

test('getChatClearedKey isolates chat cleared timestamp per user ID', () => {
  assert.equal(getChatClearedKey('farmer-123'), 'ai_chat_cleared_at_farmer-123');
  assert.equal(getChatClearedKey('farmer-456'), 'ai_chat_cleared_at_farmer-456');
  assert.equal(getChatClearedKey(undefined), 'ai_chat_cleared_at_anonymous');
});

test('getDeletedMessagesKey isolates deleted messages storage key per user ID', () => {
  assert.equal(getDeletedMessagesKey('farmer-123'), 'ai_deleted_msg_ids_farmer-123');
  assert.equal(getDeletedMessagesKey('farmer-456'), 'ai_deleted_msg_ids_farmer-456');
  assert.equal(getDeletedMessagesKey(undefined), 'ai_deleted_msg_ids_guest');
});

test('formatAiError formats 401, 429, timeout and network errors with friendly messages', () => {
  const err401 = formatAiError(401);
  assert.equal(err401.canRetry, false);
  assert.ok(err401.friendlyMessage.includes('login'));

  const err429 = formatAiError(429);
  assert.equal(err429.canRetry, true);
  assert.ok(err429.friendlyMessage.includes('jaldi'));

  const errTimeout = formatAiError(504);
  assert.equal(errTimeout.canRetry, true);
  assert.ok(errTimeout.friendlyMessage.includes('busy'));

  const errNetwork = formatAiError(undefined, 'ECONNABORTED');
  assert.equal(errNetwork.canRetry, true);
  assert.ok(errNetwork.friendlyMessage.includes('busy'));
});
