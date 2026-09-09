export const MEDIA_SCOPES = [
  'brand',
  'home',
  'products',
  'services',
  'realizations',
  'about',
  'campaigns',
] as const;

export type MediaScope =
  (typeof MEDIA_SCOPES)[number];

export type GoiMediaResourceType =
  | 'IMAGE'
  | 'VIDEO'
  | 'RAW';

export const MEDIA_FOLDER_BY_SCOPE: Record<
  MediaScope,
  string
> = {
  brand: 'goi/brand',
  home: 'goi/home',
  products: 'goi/products',
  services: 'goi/services',
  realizations: 'goi/realizations',
  about: 'goi/about',
  campaigns: 'goi/campaigns',
};

export const MEDIA_MAX_BYTES = {
  IMAGE: 10 * 1024 * 1024,
  VIDEO: 50 * 1024 * 1024,
  RAW: 15 * 1024 * 1024,
} as const;

export const ABSOLUTE_MEDIA_MAX_BYTES =
  MEDIA_MAX_BYTES.VIDEO;

const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]);

const VIDEO_MIME_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);

const RAW_MIME_TYPES = new Set([
  'application/pdf',
]);

export function getMediaResourceType(
  mimeType: string,
): GoiMediaResourceType | null {
  const normalized =
    mimeType.toLowerCase();

  if (
    IMAGE_MIME_TYPES.has(normalized)
  ) {
    return 'IMAGE';
  }

  if (
    VIDEO_MIME_TYPES.has(normalized)
  ) {
    return 'VIDEO';
  }

  if (
    RAW_MIME_TYPES.has(normalized)
  ) {
    return 'RAW';
  }

  return null;
}

export function isMediaSizeAllowed(
  resourceType: GoiMediaResourceType,
  bytes: number,
) {
  return (
    bytes > 0 &&
    bytes <=
      MEDIA_MAX_BYTES[resourceType]
  );
}

export function toCloudinaryResourceType(
  resourceType: GoiMediaResourceType,
) {
  switch (resourceType) {
    case 'IMAGE':
      return 'image' as const;
    case 'VIDEO':
      return 'video' as const;
    case 'RAW':
      return 'raw' as const;
  }
}
