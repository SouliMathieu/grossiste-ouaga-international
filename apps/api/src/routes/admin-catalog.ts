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
  sku: z.string().trim().min(2).max(64),
  name: z.string().trim().min(2).max(191),
  shortDescription: nullableText,
  description: nullableText,
  price: z.number().nonnegative().nullable(),
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
});

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildProductSlug(name: string, sku: string) {
  const slug = `${slugify(name)}-${slugify(sku)}`;

  return slug.slice(0, 191);
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
  shortDescription: string | null;
  description: string | null;
  price: unknown;
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
    shortDescription: product.shortDescription,
    description: product.description,
    price:
      product.price === null
        ? null
        : Number(product.price),
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

      const product = await prisma.product.create({
        data: {
          categoryId: parsed.data.categoryId,
          sku: parsed.data.sku,
          slug: buildProductSlug(
            parsed.data.name,
            parsed.data.sku,
          ),
          name: parsed.data.name,
          shortDescription:
            parsed.data.shortDescription,
          description: parsed.data.description,
          price: parsed.data.price,
          currency: 'XOF',
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
          sku: parsed.data.sku,
          slug: existing.slug,
          name: parsed.data.name,
          shortDescription:
            parsed.data.shortDescription,
          description: parsed.data.description,
          price: parsed.data.price,
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
