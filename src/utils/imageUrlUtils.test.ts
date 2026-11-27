import test from 'node:test';
import assert from 'node:assert/strict';
import { optimizeImageUrl, isFrescoPoolExhaustedError } from './imageUrlUtils.ts';

test('optimizeImageUrl adds Cloudinary width/quality transform without double-transforming', () => {
  const raw =
    'https://res.cloudinary.com/odsyekqk/image/upload/v1795588930/farm2home/products/mgojsvjpyo2yguj9ov9m.jpg';
  const optimized = optimizeImageUrl(raw, 400);
  assert.equal(
    optimized,
    'https://res.cloudinary.com/odsyekqk/image/upload/c_limit,w_400,q_auto,f_auto/v1795588930/farm2home/products/mgojsvjpyo2yguj9ov9m.jpg'
  );
});

test('optimizeImageUrl appends ?w=400 for backend /product/image/ thumbnails and leaves full-res unchanged when width omitted', () => {
  const backendUrl = 'https://farm2home-backend-vjo8.onrender.com/product/image/97224227.jpg';
  assert.equal(
    optimizeImageUrl(backendUrl, 400),
    'https://farm2home-backend-vjo8.onrender.com/product/image/97224227.jpg?w=400'
  );
  assert.equal(optimizeImageUrl(backendUrl), backendUrl);
});

test('isFrescoPoolExhaustedError detects Android Fresco bitmap pool OOM errors', () => {
  assert.equal(
    isFrescoPoolExhaustedError({
      error: 'Pool hard cap violation? Hard cap = 201326592 Used size = 201262404 Free size = 0 Request size = 4915200',
    }),
    true
  );
  assert.equal(isFrescoPoolExhaustedError({ error: 'HTTP 404 Not Found' }), false);
});
