import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  serializeProductMediaLinks,
  validateProductMediaSelection,
} from './product-media.js';

function media(
  id: number,
  options?: {
    status?: string;
  },
) {
  return {
    id,
    publicId: `media-${id}`,
    secureUrl:
      `https://example.com/${id}.jpg`,
    resourceType: 'IMAGE',
    width: 100,
    height: 100,
    format: 'jpg',
    bytes: 1000,
    alt: null,
    caption: null,
    folder: 'goi/products',
    status:
      options?.status ?? 'READY',
  };
}

describe('product media', () => {
  it('rejects duplicated gallery media', () => {
    expect(
      validateProductMediaSelection(
        null,
        [2, 2],
      )?.error,
    ).toBe(
      'DUPLICATE_GALLERY_MEDIA',
    );
  });

  it('rejects the main image inside the gallery', () => {
    expect(
      validateProductMediaSelection(
        1,
        [1, 2],
      )?.error,
    ).toBe(
      'MAIN_MEDIA_IN_GALLERY',
    );
  });

  it('serializes main and ordered gallery media', () => {
    const result =
      serializeProductMediaLinks([
        {
          role: 'GALLERY',
          sortOrder: 2,
          media: media(3),
        },
        {
          role: 'MAIN',
          sortOrder: 0,
          media: media(1),
        },
        {
          role: 'GALLERY',
          sortOrder: 1,
          media: media(2),
        },
      ]);

    expect(
      result.mainMedia?.id,
    ).toBe(1);

    expect(
      result.galleryMedia.map(
        (item) => item.id,
      ),
    ).toEqual([2, 3]);
  });

  it('hides archived media from public serialization', () => {
    const result =
      serializeProductMediaLinks(
        [
          {
            role: 'MAIN',
            sortOrder: 0,
            media: media(1, {
              status: 'ARCHIVED',
            }),
          },
          {
            role: 'GALLERY',
            sortOrder: 0,
            media: media(2),
          },
        ],
        {
          readyOnly: true,
        },
      );

    expect(
      result.mainMedia,
    ).toBeNull();

    expect(
      result.galleryMedia.map(
        (item) => item.id,
      ),
    ).toEqual([2]);
  });
});
