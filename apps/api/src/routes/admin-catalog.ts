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

const categorySchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: nullableText,
  imageUrl: nullableText,
  sortOrder: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
});

const categoryUpdateSchema = categorySchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message:
        'Au moins un champ doit être modifié.',
    },
  );

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

async function buildAvailableCategorySlug(
  name: string,
  excludedId?: number,
) {
  const base =
    (slugify(name) || 'categorie').slice(
      0,
      130,
    );

  let suffix = 1;

  while (true) {
    const suffixText =
      suffix === 1 ? '' : `-${suffix}`;

    const candidate = `${base.slice(
      0,
      140 - suffixText.length,
    )}${suffixText}`;

    const existing =
      await prisma.category.findFirst({
        where: {
          slug: candidate,
          ...(excludedId
            ? {
                id: {
                  not: excludedId,
                },
              }
            : {}),
        },
        select: {
          id: true,
        },
      });

    if (!existing) {
      return candidate;
    }

    suffix += 1;
  }
}

function serializeCategory(category: {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    products: number;
  };
}) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    imageUrl: category.imageUrl,
    sortOrder: category.sortOrder,
    active: category.active,
    productCount:
      category._count?.products ?? 0,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
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
  '/categories',
  async (_request, response) => {
    try {
      const categories =
        await prisma.category.findMany({
          orderBy: [
            {
              sortOrder: 'asc',
            },
            {
              name: 'asc',
            },
          ],
          include: {
            _count: {
              select: {
                products: true,
              },
            },
          },
        });

      return response.json({
        data: categories.map(
          serializeCategory,
        ),
      });
    } catch (error) {
      console.error(
        'Unable to list product categories',
        error,
      );

      return response.status(500).json({
        message:
          'Impossible de charger les catégories.',
      });
    }
  },
);

adminCatalogRouter.post(
  '/categories',
  async (request, response) => {
    const parsed =
      categorySchema.safeParse(request.body);

    if (!parsed.success) {
      return response.status(400).json({
        message:
          'Les informations de la catégorie sont invalides.',
      });
    }

    try {
      const slug =
        await buildAvailableCategorySlug(
          parsed.data.name,
        );

      const category =
        await prisma.category.create({
          data: {
            ...parsed.data,
            slug,
          },
          include: {
            _count: {
              select: {
                products: true,
              },
            },
          },
        });

      return response.status(201).json({
        data: serializeCategory(category),
      });
    } catch (error) {
      console.error(
        'Unable to create product category',
        error,
      );

      return response.status(500).json({
        message:
          'Impossible de créer la catégorie.',
      });
    }
  },
);

adminCatalogRouter.patch(
  '/categories/:id',
  async (request, response) => {
    const id = z.coerce
      .number()
      .int()
      .positive()
      .safeParse(request.params.id);

    if (!id.success) {
      return response.status(400).json({
        message:
          'Identifiant de catégorie invalide.',
      });
    }

    const parsed =
      categoryUpdateSchema.safeParse(
        request.body,
      );

    if (!parsed.success) {
      return response.status(400).json({
        message:
          'Les informations de la catégorie sont invalides.',
      });
    }

    try {
      const existing =
        await prisma.category.findUnique({
          where: {
            id: id.data,
          },
        });

      if (!existing) {
        return response.status(404).json({
          message:
            'Catégorie introuvable.',
        });
      }

      const slug =
        parsed.data.name &&
        parsed.data.name !== existing.name
          ? await buildAvailableCategorySlug(
              parsed.data.name,
              existing.id,
            )
          : undefined;

      const category =
        await prisma.category.update({
          where: {
            id: existing.id,
          },
          data: {
            ...(parsed.data.name !== undefined
              ? { name: parsed.data.name }
              : {}),
            ...(parsed.data.description !== undefined
              ? {
                  description:
                    parsed.data.description,
                }
              : {}),
            ...(parsed.data.imageUrl !== undefined
              ? { imageUrl: parsed.data.imageUrl }
              : {}),
            ...(parsed.data.sortOrder !== undefined
              ? {
                  sortOrder:
                    parsed.data.sortOrder,
                }
              : {}),
            ...(parsed.data.active !== undefined
              ? { active: parsed.data.active }
              : {}),
            ...(slug !== undefined
              ? { slug }
              : {}),
          },
          include: {
            _count: {
              select: {
                products: true,
              },
            },
          },
        });

      return response.json({
        data: serializeCategory(category),
      });
    } catch (error) {
      console.error(
        'Unable to update product category',
        error,
      );

      return response.status(500).json({
        message:
          'Impossible de modifier la catégorie.',
      });
    }
  },
);

adminCatalogRouter.delete(
  '/categories/:id',
  async (request, response) => {
    const id = z.coerce
      .number()
      .int()
      .positive()
      .safeParse(request.params.id);

    if (!id.success) {
      return response.status(400).json({
        message:
          'Identifiant de catégorie invalide.',
      });
    }

    try {
      const category =
        await prisma.category.findUnique({
          where: {
            id: id.data,
          },
          include: {
            _count: {
              select: {
                products: true,
              },
            },
          },
        });

      if (!category) {
        return response.status(404).json({
          message:
            'Catégorie introuvable.',
        });
      }

      if (category._count.products > 0) {
        return response.status(409).json({
          message:
            'Cette catégorie contient des produits. Désactivez-la ou déplacez d’abord les produits vers une autre catégorie.',
        });
      }

      await prisma.category.delete({
        where: {
          id: category.id,
        },
      });

      return response.json({
        data: {
          id: category.id,
        },
      });
    } catch (error) {
      console.error(
        'Unable to delete product category',
        error,
      );

      return response.status(500).json({
        message:
          'Impossible de supprimer la catégorie.',
      });
    }
  },
);

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

adminCatalogRouter.patch(
  '/products/:id/archive',
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
          select: {
            id: true,
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
      const [
        existing,
        adCampaignCount,
      ] = await Promise.all([
        prisma.product.findUnique({
          where: {
            id: productId,
          },
          select: {
            id: true,
          },
        }),

        prisma.adCampaign.count({
          where: {
            productId,
          },
        }),
      ]);

      if (!existing) {
        return response.status(404).json({
          error: 'PRODUCT_NOT_FOUND',
          message:
            'Ce produit est introuvable.',
        });
      }

      if (adCampaignCount > 0) {
        return response.status(409).json({
          error:
            'PRODUCT_HAS_AD_CAMPAIGNS',
          message:
            'Ce produit possède un historique publicitaire et ne peut pas être supprimé définitivement. Archivez-le à la place.',
        });
      }

      await prisma.$transaction(
        async (tx) => {
          /*
           * Les lignes de commande conservent déjà
           * les snapshots nom / SKU / prix / unité.
           * On détache donc uniquement l'identifiant
           * technique du produit avant suppression.
           */
          await tx.orderItem.updateMany({
            where: {
              productId,
            },
            data: {
              productId: null,
            },
          });

          /*
           * Les relations ProductMedia,
           * ProductAttribute, ServiceProduct et
           * RealizationProduct sont configurées
           * avec onDelete: Cascade.
           */
          await tx.product.delete({
            where: {
              id: productId,
            },
          });
        },
      );

      return response.status(204).send();
    } catch (error) {
      console.error(
        'Erreur suppression définitive produit admin :',
        error,
      );

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message:
          'Impossible de supprimer définitivement le produit.',
      });
    }
  },
);
