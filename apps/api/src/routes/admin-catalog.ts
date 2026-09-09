import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
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
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: number;
    name: string;
    slug: string;
  };
}) {
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
    keywords: product.keywords,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    category: product.category,
  };
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

      const product = await prisma.product.update({
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
        },
      });

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
