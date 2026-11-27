export const optimizeImageUrl = (
  url?: string | null,
  width?: number
): string | null => {
  if (!url) return null;
  if (!width || width <= 0) return url;

  const targetWidth = Math.max(120, Math.min(Math.round(width), 1200));

  if (url.includes('res.cloudinary.com') && url.includes('/image/upload/')) {
    const marker = '/image/upload/';
    const idx = url.indexOf(marker);
    const tail = url.slice(idx + marker.length);
    // Avoid duplicating transforms if already transformed (starts with v123/ or filename directly when untransformed)
    if (tail.startsWith('v') || !tail.includes('/') || /^[a-zA-Z0-9_-]+\.[a-zA-Z]+$/.test(tail)) {
      return `${url.slice(0, idx + marker.length)}c_limit,w_${targetWidth},q_auto,f_auto/${tail}`;
    }
    return url;
  }

  if (url.includes('/product/image/') && !/[?&]w=/.test(url)) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}w=${targetWidth}`;
  }

  return url;
};

export const isFrescoPoolExhaustedError = (nativeEvent: any): boolean => {
  const errStr = String(nativeEvent?.error || nativeEvent?.message || '').toLowerCase();
  return (
    errStr.includes('pool hard cap') ||
    errStr.includes('hard cap =') ||
    errStr.includes('outofmemory') ||
    errStr.includes('out of memory')
  );
};
