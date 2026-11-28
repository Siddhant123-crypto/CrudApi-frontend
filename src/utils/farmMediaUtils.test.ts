import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveFarmMediaUploadMeta } from './farmMediaUtils.ts';

test('resolveFarmMediaUploadMeta handles Android content URI without extension for farm photo', () => {
  const result = resolveFarmMediaUploadMeta({
    uri: 'content://media/picker/0/com.android.providers.media.photopicker/media/10000123',
    mimeType: 'image/png',
    type: 'image',
  });

  assert.equal(result.isVideo, false);
  assert.equal(result.mimeType, 'image/png');
  assert.equal(result.fileName.endsWith('.png'), true);
});

test('resolveFarmMediaUploadMeta handles file URI with extension cleanly', () => {
  const result = resolveFarmMediaUploadMeta('file:///data/user/0/app/cache/farm_view.jpg');

  assert.equal(result.isVideo, false);
  assert.equal(result.mimeType, 'image/jpeg');
  assert.equal(result.fileName, 'farm_view.jpg');
});

test('resolveFarmMediaUploadMeta handles selected farm video asset', () => {
  const result = resolveFarmMediaUploadMeta({
    uri: 'content://media/external/video/media/445',
    fileName: 'harvest_tour.mp4',
    mimeType: 'video/mp4',
    type: 'video',
  });

  assert.equal(result.isVideo, true);
  assert.equal(result.mimeType, 'video/mp4');
  assert.equal(result.fileName, 'harvest_tour.mp4');
});
