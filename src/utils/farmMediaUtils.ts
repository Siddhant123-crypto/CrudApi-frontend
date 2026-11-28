export interface PickedFarmMediaAsset {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  type?: string | null;
}

const IMAGE_MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
};

const VIDEO_MIME_BY_EXT: Record<string, string> = {
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
  mkv: 'video/x-matroska',
};

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
  'video/x-matroska': 'mkv',
};

/**
 * Resolves a safe filename and MIME type for farm photo/video multipart uploads,
 * handling Android content:// URIs that omit file extensions.
 */
export const resolveFarmMediaUploadMeta = (
  asset: PickedFarmMediaAsset | string
): { uri: string; mimeType: string; fileName: string; isVideo: boolean } => {
  const normalizedAsset: PickedFarmMediaAsset =
    typeof asset === 'string' ? { uri: asset } : asset;

  const uri = normalizedAsset.uri;
  const rawMime = String(normalizedAsset.mimeType || '')
    .split(';')[0]
    .trim()
    .toLowerCase();

  const rawCandidateName = String(
    normalizedAsset.fileName || uri.split('/').pop() || ''
  )
    .split('?')[0]
    .replace(/[:\\/]/g, '_')
    .trim();

  const extMatch = /\.([a-zA-Z0-9]+)$/.exec(rawCandidateName);
  const extFromName = extMatch ? extMatch[1].toLowerCase() : '';

  const isVideo =
    normalizedAsset.type === 'video' ||
    rawMime.startsWith('video/') ||
    Boolean(extFromName && VIDEO_MIME_BY_EXT[extFromName]);

  let mimeType = '';
  if (rawMime && (IMAGE_MIME_BY_EXT[rawMime] || EXT_BY_MIME[rawMime])) {
    mimeType = rawMime;
  } else if (extFromName && VIDEO_MIME_BY_EXT[extFromName]) {
    mimeType = VIDEO_MIME_BY_EXT[extFromName];
  } else if (extFromName && IMAGE_MIME_BY_EXT[extFromName]) {
    mimeType = IMAGE_MIME_BY_EXT[extFromName];
  } else {
    mimeType = isVideo ? 'video/mp4' : 'image/jpeg';
  }

  const finalExt =
    (extFromName &&
    ((isVideo && VIDEO_MIME_BY_EXT[extFromName]) ||
      (!isVideo && IMAGE_MIME_BY_EXT[extFromName]))
      ? extFromName
      : EXT_BY_MIME[mimeType]) || (isVideo ? 'mp4' : 'jpg');

  const baseName =
    rawCandidateName.replace(/\.[^.]+$/, '').trim() ||
    (isVideo ? 'farm_video' : 'farm_photo');

  return {
    uri,
    mimeType,
    fileName: `${baseName}.${finalExt}`,
    isVideo,
  };
};
