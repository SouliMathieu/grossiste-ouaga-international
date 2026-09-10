export type ProductMediaLinkLike = {
  role: string;
  sortOrder: number;
  media: {
    id: number;
    publicId: string;
    secureUrl: string;
    resourceType: string;
    width: number | null;
    height: number | null;
    format: string | null;
    bytes: number | null;
    alt: string | null;
    caption: string | null;
    folder: string;
    status: string;
  };
};

export function validateProductMediaSelection(
  mainMediaId: number | null,
  galleryMediaIds: number[],
) {
  const uniqueGalleryIds =
    new Set(galleryMediaIds);

  if (
    uniqueGalleryIds.size !==
    galleryMediaIds.length
  ) {
    return {
      error: 'DUPLICATE_GALLERY_MEDIA',
      message:
        'Un même média ne peut apparaître plusieurs fois dans la galerie.',
    };
  }

  if (
    mainMediaId !== null &&
    uniqueGalleryIds.has(mainMediaId)
  ) {
    return {
      error: 'MAIN_MEDIA_IN_GALLERY',
      message:
        'L’image principale ne doit pas être répétée dans la galerie.',
    };
  }

  return null;
}

export function serializeProductMediaLinks(
  links: ProductMediaLinkLike[],
  options?: {
    readyOnly?: boolean;
  },
) {
  const readyOnly =
    options?.readyOnly ?? false;

  const usableLinks = links.filter(
    (link) =>
      !readyOnly ||
      link.media.status === 'READY',
  );

  const imageLinks =
    usableLinks.filter(
      (link) =>
        link.media.resourceType ===
        'IMAGE',
    );

  const mainLink =
    imageLinks
      .filter(
        (link) =>
          link.role === 'MAIN',
      )
      .sort(
        (left, right) =>
          left.sortOrder -
          right.sortOrder,
      )[0] ?? null;

  const galleryMedia =
    imageLinks
      .filter(
        (link) =>
          link.role === 'GALLERY',
      )
      .sort(
        (left, right) =>
          left.sortOrder -
          right.sortOrder,
      )
      .map(
        (link) => link.media,
      );

  const datasheetLink =
    usableLinks
      .filter(
        (link) =>
          link.role === 'DATASHEET' &&
          link.media.resourceType ===
            'RAW',
      )
      .sort(
        (left, right) =>
          left.sortOrder -
          right.sortOrder,
      )[0] ?? null;

  return {
    mainMedia:
      mainLink?.media ?? null,
    galleryMedia,
    datasheetMedia:
      datasheetLink?.media ?? null,
  };
}
