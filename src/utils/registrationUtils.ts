export const isAuthPublicEndpoint = (url: string): boolean =>
  url.startsWith('/auth/') ||
  url.includes('/login') ||
  url.includes('/register') ||
  url.startsWith('/farmer/save') ||
  url.includes('/forgot-password') ||
  url.includes('/reset-password') ||
  url === '/health';

export interface UploadPhotoAsset {
  uri: string;
  fileName?: string | null;
  name?: string | null;
  mimeType?: string | null;
  type?: string | null;
}

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export const buildProfilePhotoFormPart = (
  photo: UploadPhotoAsset
): { uri: string; name: string; type: string } => {
  const rawName = String(
    photo.fileName || photo.name || photo.uri.split('/').pop() || 'profile.jpg'
  )
    .split('?')[0]
    .replace(/[:\\/]/g, '_')
    .trim();

  const normalizedMime = String(photo.mimeType || photo.type || '')
    .split(';')[0]
    .trim()
    .toLowerCase();

  const extMatch = /\.([a-zA-Z0-9]+)$/.exec(rawName);
  const rawExt = extMatch ? extMatch[1].toLowerCase() : '';

  if (rawExt && EXT_TO_MIME[rawExt]) {
    const type = MIME_TO_EXT[normalizedMime] ? normalizedMime : EXT_TO_MIME[rawExt];
    const safeName = rawName.startsWith('.') ? `profile${rawName}` : rawName;
    return { uri: photo.uri, name: safeName, type };
  }

  const extFromMime = MIME_TO_EXT[normalizedMime] || '.jpg';
  const type = MIME_TO_EXT[normalizedMime] ? normalizedMime : 'image/jpeg';
  const baseName = (rawName.replace(/\.[^.]+$/, '') || 'profile').trim() || 'profile';

  return {
    uri: photo.uri,
    name: `${baseName}${extFromMime}`,
    type,
  };
};
