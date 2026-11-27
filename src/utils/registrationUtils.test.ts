import test from 'node:test';
import assert from 'node:assert/strict';
import { buildProfilePhotoFormPart, isAuthPublicEndpoint } from './registrationUtils.ts';
import { mapApiError } from './errorUtils.ts';

const dummyT = ((_key: string, fallback?: string) => fallback || _key) as any;

test('isAuthPublicEndpoint permits /farmer/save and /user/register even after logout', () => {
  assert.equal(isAuthPublicEndpoint('/farmer/save'), true);
  assert.equal(isAuthPublicEndpoint('/user/register'), true);
  assert.equal(isAuthPublicEndpoint('/auth/login'), true);
  assert.equal(isAuthPublicEndpoint('/farmer/login'), true);
  assert.equal(isAuthPublicEndpoint('/admin/dashboard'), false);
  assert.equal(isAuthPublicEndpoint('/order/place'), false);
});

test('buildProfilePhotoFormPart handles Android content URI without extension cleanly', () => {
  const part = buildProfilePhotoFormPart({
    uri: 'content://com.android.providers.media.documents/document/image%3A1234',
    mimeType: 'image/png',
  });

  assert.equal(part.uri, 'content://com.android.providers.media.documents/document/image%3A1234');
  assert.equal(part.type, 'image/png');
  assert.ok(part.name.endsWith('.png'));
});

test('buildProfilePhotoFormPart preserves valid filename and normalizes mime type', () => {
  const part = buildProfilePhotoFormPart({
    uri: 'file:///cache/ImagePicker/avatar.JPG',
    fileName: 'avatar.JPG',
  });

  assert.equal(part.name, 'avatar.JPG');
  assert.equal(part.type, 'image/jpeg');
});

test('mapApiError surfaces mobile duplicate, validation, 413, and 429 messages clearly', () => {
  assert.equal(
    mapApiError({ response: { status: 409, data: { message: 'Mobile already exists' } } }, dummyT),
    'An account with this mobile number already exists.'
  );
  assert.equal(
    mapApiError({ response: { status: 400, data: { message: 'State is required' } } }, dummyT),
    'State is required'
  );
  assert.equal(
    mapApiError({ response: { status: 429, data: { message: 'Too many authentication attempts.' } } }, dummyT),
    'Too many requests. Please try again shortly.'
  );
  assert.equal(
    mapApiError({ response: { status: 413, data: { message: 'File too large' } } }, dummyT),
    'Uploaded photo is too large (max 5 MB). Please choose a smaller image.'
  );
});
