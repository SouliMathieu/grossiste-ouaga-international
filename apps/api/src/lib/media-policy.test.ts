import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  MEDIA_FOLDER_BY_SCOPE,
  getMediaResourceType,
  isMediaSizeAllowed,
  toCloudinaryResourceType,
} from './media-policy.js';

describe('GOI media policy', () => {
  it('forces the expected Cloudinary folders', () => {
    expect(
      MEDIA_FOLDER_BY_SCOPE,
    ).toEqual({
      brand: 'goi/brand',
      home: 'goi/home',
      products: 'goi/products',
      services: 'goi/services',
      realizations:
        'goi/realizations',
      about: 'goi/about',
      campaigns: 'goi/campaigns',
    });
  });

  it('recognizes supported image formats', () => {
    expect(
      getMediaResourceType(
        'image/jpeg',
      ),
    ).toBe('IMAGE');

    expect(
      getMediaResourceType(
        'image/svg+xml',
      ),
    ).toBeNull();
  });

  it('recognizes videos and PDF documents', () => {
    expect(
      getMediaResourceType(
        'video/mp4',
      ),
    ).toBe('VIDEO');

    expect(
      getMediaResourceType(
        'application/pdf',
      ),
    ).toBe('RAW');
  });

  it('rejects files above their specific limit', () => {
    expect(
      isMediaSizeAllowed(
        'IMAGE',
        11 * 1024 * 1024,
      ),
    ).toBe(false);

    expect(
      isMediaSizeAllowed(
        'IMAGE',
        5 * 1024 * 1024,
      ),
    ).toBe(true);
  });

  it('maps internal types to Cloudinary types', () => {
    expect(
      toCloudinaryResourceType(
        'IMAGE',
      ),
    ).toBe('image');

    expect(
      toCloudinaryResourceType(
        'VIDEO',
      ),
    ).toBe('video');

    expect(
      toCloudinaryResourceType(
        'RAW',
      ),
    ).toBe('raw');
  });
});
