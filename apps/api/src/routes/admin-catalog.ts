import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import {
  serializeProductMediaLinks,
  validateProductMediaSelection,
} from '../lib/product-media.js';
import { requireAdmin } from '../middleware/require-admin.js';

export const adminCatalogRouter = Router();

adminCatalogRouter.use(requireAdmin);

const nullableText = z
  .union([z.string().trim(), z.null()])
  .optional()
  .transform((value) => value || null);

const productSchema = z.object({
  categoryId: z.number().int().positive(),
  name: z.string().trim().min(2).max(191),
  brand: nullableText,
  shortDescription: nullableText,
  description: nullableText,
  price: z.number().nonnegative().nullable(),
  priceOnRequest: z.boolean().optional(),
  promoPrice: z.number().nonnegative().nullable().optional(),
  promoStartAt: z.coerce.date().nullable().optional(),
  promoEndAt: z.coerce.date().nullable().optional(),
  unit: z.string().trim().min(1).max(50),
  minOrderQty: z.number().int().positive(),
  packSize: z.number().int().positive(),
  availability: z.enum([
    'IN_STOCK',
    'LOW_STOCK',
    'OUT_OF_STOCK',
    'ON_ORDER',
  ]),
  stockQuantity: z.number().int().nonnegative().nullable(),
  featured: z.boolean(),
  status: z.enum([
    'DRAFT',
    'PUBLISHED',
    'ARCHIVED',
  ]),
  imageUrl: nullableText,
  mainMediaId: z
    .number()
    .int()
    .positive()
    .nullable()
    .optional(),
  galleryMediaIds: z
    .array(
      z.number().int().positive(),
    )
    .max(20)
    .optional(),
  datasheetMediaId: z
    .number()
    .int()
    .positive()
    .nullable()
    .optional(),
  attributes: z
    .array(
      z.object({
        name: z
          .string()
          .trim()
          .min(1)
          .max(120),
        value: z
          .string()
          .trim()
          .min(1)
          .max(500),
      }),
    )
    .max(50)
    .optional(),
  keywords: nullableText,
}).superRefine((data, ctx) => {
  const priceOnRequest =
    data.priceOnRequest ?? (data.price === null);

  const hasPromoPrice =
    data.promoPrice !== undefined &&
    data.promoPrice !== null;

  const hasPromoStart =
    data.promoStartAt !== undefined &&
    data.promoStartAt !== null;

  const hasPromoEnd =
    data.promoEndAt !== undefined &&
    data.promoEndAt !== null;

  if (!priceOnRequest && data.price === null) {
    ctx.addIssue({
      code: 'custom',
      path: ['price'],
      message:
        'Un produit vendu directement doit avoir un prix.',
    });
  }

  if (
    priceOnRequest &&
    (hasPromoPrice || hasPromoStart || hasPromoEnd)
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['promoPrice'],
      message:
        'Un produit sur devis ne peut pas avoir de promotion.',
    });
  }

  if (
    hasPromoPrice &&
    data.price !== null &&
    data.promoPrice! >= data.price
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['promoPrice'],
      message:
        'Le prix promotionnel doit être inférieur au prix normal.',
    });
  }

  if (
    hasPromoPrice &&
    (!hasPromoStart || !hasPromoEnd)
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['promoStartAt'],
      message:
        'Une promotion doit avoir une date de début et une date de fin.',
    });
  }

  if (
    !hasPromoPrice &&
    (hasPromoStart || hasPromoEnd)
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['promoPrice'],
      message:
        'Renseignez un prix promotionnel avant les dates.',
    });
  }

  if (
    hasPromoStart &&
    hasPromoEnd &&
    data.promoStartAt! >= data.promoEndAt!
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['promoEndAt'],
      message:
        'La date de fin doit être postérieure à la date de début.',
    });
  }
});

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildProductSku(productId: number) {
  return `GOI-${String(productId).padStart(6, '0')}`;
}

function buildProductSlugBase(name: string) {
  const slug = slugify(name) || 'produit';

  return slug.slice(0, 180);
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2002'
  );
}

function serializeProduct(product: {
  id: number;
  categoryId: number;
  sku: string;
  slug: string;
  name: string;
  brand: string | null;
  shortDescription: string | null;
  description: string | null;
  price: unknown;
  priceOnRequest: boolean;
  promoPrice: unknown;
  promoStartAt: Date | null;
  promoEndAt: Date | null;
  currency: string;
  unit: string;
  minOrderQty: number;
  packSize: number;
  availability: string;
  stockQuantity: number | null;
  featured: boolean;
  status: string;
  imageUrl: string | null;
  keywords: string | null;
  media: Parameters<
    typeof serializeProductMediaLinks
  >[0];
  attributes?: Array<{
    id: number;
    name: string;
    value: string;
    sortOrder: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: number;
    name: string;
    slug: string;
  };
}) {
  const serializedMedia =
    serializeProductMediaLinks(
      product.media,
    );

  return {
    id: product.id,
    categoryId: product.categoryId,
    sku: product.sku,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    shortDescription: product.shortDescription,
    description: product.description,
    price:
      product.price === null
        ? null
        : Number(product.price),
    priceOnRequest: product.priceOnRequest,
    promoPrice:
      product.promoPrice === null
        ? null
        : Number(product.promoPrice),
    promoStartAt: product.promoStartAt,
    promoEndAt: product.promoEndAt,
    currency: product.currency,
    unit: product.unit,
    minOrderQty: product.minOrderQty,
    packSize: product.packSize,
    availability: product.availability,
    stockQuantity: product.stockQuantity,
    featured: product.featured,
    status: product.status,
    imageUrl: product.imageUrl,
    mainMedia:
      serializedMedia.mainMedia,
    galleryMedia:
      serializedMedia.galleryMedia,
    datasheetMedia:
      serializedMedia.datasheetMedia,
    attributes:
      product.attributes ?? [],
    keywords: product.keywords,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    category: product.category,
  };
}

async function validateProductMediaAssets(
  mainMediaId: number | null,
  galleryMediaIds: number[],
) {
  const selectionError =
    validateProductMediaSelection(
      mainMediaId,
      galleryMediaIds,
    );

  if (selectionError) {
    return selectionError;
  }

  const mediaIds = [
    ...new Set([
      ...(mainMediaId === null
        ? []
        : [mainMediaId]),
      ...galleryMediaIds,
    ]),
  ];

  if (mediaIds.length === 0) {
    return null;
  }

  const assets =
    await prisma.mediaAsset.findMany({
      where: {
        id: {
          in: mediaIds,
        },
      },
      select: {
        id: true,
        resourceType: true,
        status: true,
      },
    });

  if (
    assets.length !== mediaIds.length
  ) {
    return {
      error: 'UNKNOWN_PRODUCT_MEDIA',
      message:
        'Un ou plusieurs médias sélectionnés sont introuvables.',
    };
  }

  if (
    assets.some(
      (asset) =>
        asset.status !== 'READY',
    )
  ) {
    return {
      error: 'PRODUCT_MEDIA_NOT_READY',
      message:
        'Seuls les médias actifs peuvent être associés à un produit.',
    };
  }

  if (
    assets.some(
      (asset) =>
        asset.resourceType !== 'IMAGE',
    )
  ) {
    return {
      error: 'INVALID_PRODUCT_MEDIA_TYPE',
      message:
        'L’image principale et la galerie doivent utiliser des images.',
    };
  }

  return null;
}

async function validateProductDatasheet(
  mediaId: number | null,
) {
  if (mediaId === null) {
    return null;
  }

  const asset =
    await prisma.mediaAsset.findUnique({
      where: {
        id: mediaId,
      },
      select: {
        id: true,
        resourceType: true,
        status: true,
        format: true,
      },
    });

  if (!asset) {
    return {
      error: 'UNKNOWN_PRODUCT_DATASHEET',
      message:
        'La fiche technique sélectionnée est introuvable.',
    };
  }

  if (asset.status !== 'READY') {
    return {
      error: 'PRODUCT_DATASHEET_NOT_READY',
      message:
        'Seul un document actif peut être utilisé comme fiche technique.',
    };
  }

  if (asset.resourceType !== 'RAW') {
    return {
      error: 'INVALID_PRODUCT_DATASHEET_TYPE',
      message:
        'La fiche technique doit être un document PDF.',
    };
  }

  return null;
}

function buildProductMediaRows(
  productId: number,
  mainMediaId: number | null,
  galleryMediaIds: number[],
  datasheetMediaId: number | null = null,
) {
  return [
    ...(mainMediaId === null
      ? []
      : [
          {
            productId,
            mediaId: mainMediaId,
            role: 'MAIN' as const,
            sortOrder: 0,
          },
        ]),
    ...galleryMediaIds.map(
      (mediaId, index) => ({
        productId,
        mediaId,
        role: 'GALLERY' as const,
        sortOrder: index,
      }),
    ),
    ...(datasheetMediaId === null
      ? []
      : [
          {
            productId,
            mediaId: datasheetMediaId,
            role: 'DATASHEET' as const,
            sortOrder: 0,
          },
        ]),
  ];
}

adminCatalogRouter.get(
  '/products',
  async (_request, response) => {
    try {
      const products = await prisma.product.findMany({
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          media: {
            include: {
              media: true,
            },
            orderBy: {
              sortOrder: 'asc',
            },
          },
          attributes: {
            orderBy: {
              sortOrder: 'asc',
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: 200,
      });

      return response.json({
        data: products.map(serializeProduct),
      });
    } catch (error) {
      console.error(
        'Erreur liste produits admin :',
        error,
      );

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message:
          'Impossible de récupérer les produits.',
      });
    }
  },
);

adminCatalogRouter.post(
  '/products',
  async (request, response) => {
    const parsed = productSchema.safeParse(request.body);

    if (!parsed.success) {
      return response.status(400).json({
        error: 'VALIDATION_ERROR',
        message:
          'Les informations du produit sont invalides.',
        details: parsed.error.issues,
      });
    }

    try {
      const category =
        await prisma.category.findUnique({
          where: {
            id: parsed.data.categoryId,
          },
        });

      if (!category) {
        return response.status(400).json({
          error: 'UNKNOWN_CATEGORY',
          message:
            'La catégorie sélectionnée est introuvable.',
        });
      }

      const mainMediaId =
        parsed.data.mainMediaId ?? null;

      const galleryMediaIds =
        parsed.data.galleryMediaIds ?? [];

      const datasheetMediaId =
        parsed.data.datasheetMediaId ?? null;

      const attributes =
        parsed.data.attributes ?? [];

      const mediaValidation =
        await validateProductMediaAssets(
          mainMediaId,
          galleryMediaIds,
        );

      if (mediaValidation) {
        return response.status(400).json(
          mediaValidation,
        );
      }

      const datasheetValidation =
        await validateProductDatasheet(
          datasheetMediaId,
        );

      if (datasheetValidation) {
        return response.status(400).json(
          datasheetValidation,
        );
      }

      const product = await prisma.$transaction(
        async (tx) => {
          const temporaryKey = randomUUID().replaceAll(
            '-',
            '',
          );

          const priceOnRequest =
            parsed.data.priceOnRequest ??
            parsed.data.price === null;

          const temporaryProduct =
            await tx.product.create({
              data: {
                categoryId: parsed.data.categoryId,
                sku: `TMP-${temporaryKey}`.slice(0, 64),
                slug: `tmp-${temporaryKey}`.slice(0, 191),
                name: parsed.data.name,
                brand: parsed.data.brand,
                shortDescription:
                  parsed.data.shortDescription,
                description:
                  parsed.data.description,
                price: priceOnRequest
                  ? null
                  : parsed.data.price,
                priceOnRequest,
                promoPrice: priceOnRequest
                  ? null
                  : parsed.data.promoPrice ?? null,
                promoStartAt: priceOnRequest
                  ? null
                  : parsed.data.promoStartAt ?? null,
                promoEndAt: priceOnRequest
                  ? null
                  : parsed.data.promoEndAt ?? null,
                currency: 'XOF',
                unit: parsed.data.unit,
                minOrderQty:
                  parsed.data.minOrderQty,
                packSize: parsed.data.packSize,
                availability:
                  parsed.data.availability,
                stockQuantity:
                  parsed.data.stockQuantity,
                featured: parsed.data.featured,
                status: parsed.data.status,
                imageUrl: parsed.data.imageUrl,
                keywords: parsed.data.keywords,
              },
            });

          const sku = buildProductSku(
            temporaryProduct.id,
          );

          const baseSlug = buildProductSlugBase(
            parsed.data.name,
          );

          const slugCollision =
            await tx.product.findFirst({
              where: {
                slug: baseSlug,
                NOT: {
                  id: temporaryProduct.id,
                },
              },
              select: {
                id: true,
              },
            });

          const slug = slugCollision
            ? `${baseSlug}-${temporaryProduct.id}`.slice(
                0,
                191,
              )
            : baseSlug;

          const mediaRows =
            buildProductMediaRows(
              temporaryProduct.id,
              mainMediaId,
              galleryMediaIds,
              datasheetMediaId,
            );

          if (mediaRows.length > 0) {
            await tx.productMedia.createMany({
              data: mediaRows,
            });
          }

          if (attributes.length > 0) {
            await tx.productAttribute.createMany({
              data: attributes.map(
                (attribute, index) => ({
                  productId:
                    temporaryProduct.id,
                  name: attribute.name,
                  value: attribute.value,
                  sortOrder: index,
                }),
              ),
            });
          }

          return tx.product.update({
            where: {
              id: temporaryProduct.id,
            },
            data: {
              sku,
              slug,
            },
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
              media: {
                include: {
                  media: true,
                },
                orderBy: {
                  sortOrder: 'asc',
                },
              },
              attributes: {
                orderBy: {
                  sortOrder: 'asc',
                },
              },
            },
          });
        },
      );

      return response.status(201).json({
        data: serializeProduct(product),
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return response.status(409).json({
          error: 'DUPLICATE_PRODUCT',
          message:
            'Un produit utilise déjà ce SKU ou ce slug.',
        });
      }

      console.error(
        'Erreur création produit admin :',
        error,
      );

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message:
          'Impossible de créer le produit.',
      });
    }
  },
);

adminCatalogRouter.patch(
  '/products/:id',
  async (request, response) => {
    const productId = Number(request.params.id);

    if (
      !Number.isInteger(productId) ||
      productId <= 0
    ) {
      return response.status(400).json({
        error: 'INVALID_PRODUCT_ID',
        message: 'Identifiant produit invalide.',
      });
    }

    const parsed = productSchema.safeParse(
      request.body,
    );

    if (!parsed.success) {
      return response.status(400).json({
        error: 'VALIDATION_ERROR',
        message:
          'Les informations du produit sont invalides.',
        details: parsed.error.issues,
      });
    }

    try {
      const existing =
        await prisma.product.findUnique({
          where: {
            id: productId,
          },
        });

      if (!existing) {
        return response.status(404).json({
          error: 'PRODUCT_NOT_FOUND',
          message: 'Ce produit est introuvable.',
        });
      }

      const category =
        await prisma.category.findUnique({
          where: {
            id: parsed.data.categoryId,
          },
        });

      if (!category) {
        return response.status(400).json({
          error: 'UNKNOWN_CATEGORY',
          message:
            'La catégorie sélectionnée est introuvable.',
        });
      }

      const mediaSelectionProvided =
        parsed.data.mainMediaId !==
          undefined ||
        parsed.data.galleryMediaIds !==
          undefined ||
        parsed.data.datasheetMediaId !==
          undefined;

      let mainMediaId:
        number | null = null;

      let galleryMediaIds:
        number[] = [];

      let datasheetMediaId:
        number | null = null;

      if (mediaSelectionProvided) {
        const existingMedia =
          await prisma.productMedia.findMany({
            where: {
              productId,
              role: {
                in: [
                  'MAIN',
                  'GALLERY',
                  'DATASHEET',
                ],
              },
            },
            select: {
              mediaId: true,
              role: true,
              sortOrder: true,
            },
            orderBy: {
              sortOrder: 'asc',
            },
          });

        const existingMainMediaId =
          existingMedia.find(
            (item) =>
              item.role === 'MAIN',
          )?.mediaId ?? null;

        const existingGalleryMediaIds =
          existingMedia
            .filter(
              (item) =>
                item.role ===
                'GALLERY',
            )
            .map(
              (item) => item.mediaId,
            );

        const existingDatasheetMediaId =
          existingMedia.find(
            (item) =>
              item.role ===
              'DATASHEET',
          )?.mediaId ?? null;

        mainMediaId =
          parsed.data.mainMediaId ===
          undefined
            ? existingMainMediaId
            : parsed.data.mainMediaId;

        galleryMediaIds =
          parsed.data.galleryMediaIds ===
          undefined
            ? existingGalleryMediaIds
            : parsed.data.galleryMediaIds;

        datasheetMediaId =
          parsed.data.datasheetMediaId ===
          undefined
            ? existingDatasheetMediaId
            : parsed.data.datasheetMediaId;

        const mediaValidation =
          await validateProductMediaAssets(
            mainMediaId,
            galleryMediaIds,
          );

        if (mediaValidation) {
          return response
            .status(400)
            .json(mediaValidation);
        }

        const datasheetValidation =
          await validateProductDatasheet(
            datasheetMediaId,
          );

        if (datasheetValidation) {
          return response
            .status(400)
            .json(datasheetValidation);
        }
      }

      const product =
        await prisma.$transaction(
          async (tx) => {
            await tx.product.update({
        where: {
          id: productId,
        },
        data: {
          categoryId: parsed.data.categoryId,
          slug: existing.slug,
          name: parsed.data.name,
          brand: parsed.data.brand,
          shortDescription:
            parsed.data.shortDescription,
          description: parsed.data.description,
          price:
            (
              parsed.data.priceOnRequest ??
              existing.priceOnRequest
            )
              ? null
              : parsed.data.price,
          priceOnRequest:
            parsed.data.priceOnRequest ??
            existing.priceOnRequest,
          promoPrice:
            (
              parsed.data.priceOnRequest ??
              existing.priceOnRequest
            )
              ? null
              : parsed.data.promoPrice === undefined
                ? existing.promoPrice
                : parsed.data.promoPrice,
          promoStartAt:
            (
              parsed.data.priceOnRequest ??
              existing.priceOnRequest
            )
              ? null
              : parsed.data.promoStartAt === undefined
                ? existing.promoStartAt
                : parsed.data.promoStartAt,
          promoEndAt:
            (
              parsed.data.priceOnRequest ??
              existing.priceOnRequest
            )
              ? null
              : parsed.data.promoEndAt === undefined
                ? existing.promoEndAt
                : parsed.data.promoEndAt,
          unit: parsed.data.unit,
          minOrderQty: parsed.data.minOrderQty,
          packSize: parsed.data.packSize,
          availability: parsed.data.availability,
          stockQuantity:
            parsed.data.stockQuantity,
          featured: parsed.data.featured,
          status: parsed.data.status,
          imageUrl: parsed.data.imageUrl,
          keywords: parsed.data.keywords,
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          media: {
            include: {
              media: true,
            },
            orderBy: {
              sortOrder: 'asc',
            },
          },
        },
            });

            if (
              mediaSelectionProvided
            ) {
              await tx.productMedia.deleteMany({
                where: {
                  productId,
                  role: {
                    in: [
                      'MAIN',
                      'GALLERY',
                    ],
                  },
                },
              });

              const mediaRows =
                buildProductMediaRows(
                  productId,
                  mainMediaId,
                  galleryMediaIds,
                  datasheetMediaId,
                );

              if (
                mediaRows.length > 0
              ) {
                await tx.productMedia.createMany({
                  data: mediaRows,
                });
              }
            }

            if (
              parsed.data.attributes !==
              undefined
            ) {
              await tx.productAttribute.deleteMany({
                where: {
                  productId,
                },
              });

              if (
                parsed.data.attributes.length >
                0
              ) {
                await tx.productAttribute.createMany({
                  data:
                    parsed.data.attributes.map(
                      (
                        attribute,
                        index,
                      ) => ({
                        productId,
                        name:
                          attribute.name,
                        value:
                          attribute.value,
                        sortOrder:
                          index,
                      }),
                    ),
                });
              }
            }

            return tx.product.findUniqueOrThrow({
              where: {
                id: productId,
              },
              include: {
                category: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
                media: {
                  include: {
                    media: true,
                  },
                  orderBy: {
                    sortOrder: 'asc',
                  },
                },
              },
            });
          },
        );

      return response.json({
        data: serializeProduct(product),
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return response.status(409).json({
          error: 'DUPLICATE_PRODUCT',
          message:
            'Un produit utilise déjà ce SKU ou ce slug.',
        });
      }

      console.error(
        'Erreur modification produit admin :',
        error,
      );

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message:
          'Impossible de modifier le produit.',
      });
    }
  },
);

adminCatalogRouter.delete(
  '/products/:id',
  async (request, response) => {
    const productId = Number(request.params.id);

    if (
      !Number.isInteger(productId) ||
      productId <= 0
    ) {
      return response.status(400).json({
        error: 'INVALID_PRODUCT_ID',
        message: 'Identifiant produit invalide.',
      });
    }

    try {
      const existing =
        await prisma.product.findUnique({
          where: {
            id: productId,
          },
        });

      if (!existing) {
        return response.status(404).json({
          error: 'PRODUCT_NOT_FOUND',
          message: 'Ce produit est introuvable.',
        });
      }

      await prisma.product.update({
        where: {
          id: productId,
        },
        data: {
          status: 'ARCHIVED',
          featured: false,
        },
      });

      return response.status(204).send();
    } catch (error) {
      console.error(
        'Erreur archivage produit admin :',
        error,
      );

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message:
          'Impossible d’archiver le produit.',
      });
    }
  },
);
