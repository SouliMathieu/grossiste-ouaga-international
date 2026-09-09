import { Router } from 'express';
import { z } from 'zod';
import type { Prisma } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import {
  serializeProductMediaLinks,
} from '../lib/product-media.js';

export const catalogRouter = Router();

const catalogQuerySchema = z
  .object({
    q: z
      .string()
      .trim()
      .max(100)
      .optional()
      .transform((value) => value || undefined),

    category: z
      .string()
      .trim()
      .max(140)
      .optional()
      .transform((value) => value || undefined),

    availability: z
      .enum([
        'IN_STOCK',
        'LOW_STOCK',
        'OUT_OF_STOCK',
        'ON_ORDER',
      ])
      .optional(),

    minPrice: z.coerce.number().nonnegative().optional(),
    maxPrice: z.coerce.number().nonnegative().optional(),

    featured: z
      .enum(['true', 'false'])
      .optional()
      .transform((value) =>
        value === undefined ? undefined : value === 'true',
      ),

    sort: z
      .enum([
        'newest',
        'price_asc',
        'price_desc',
        'name_asc',
      ])
      .default('newest'),
  })
  .superRefine((data, context) => {
    if (
      data.minPrice !== undefined &&
      data.maxPrice !== undefined &&
      data.minPrice > data.maxPrice
    ) {
      context.addIssue({
        code: 'custom',
        path: ['minPrice'],
        message:
          'Le prix minimum ne peut pas dépasser le prix maximum.',
      });
    }
  });

function getPromotionState(product: {
  price: unknown;
  priceOnRequest: boolean;
  promoPrice: unknown;
  promoStartAt: Date | null;
  promoEndAt: Date | null;
}) {
  const normalPrice =
    product.price === null
      ? null
      : Number(product.price);

  const promoPrice =
    product.promoPrice === null
      ? null
      : Number(product.promoPrice);

  const now = Date.now();

  const promotionActive =
    !product.priceOnRequest &&
    normalPrice !== null &&
    promoPrice !== null &&
    product.promoStartAt !== null &&
    product.promoEndAt !== null &&
    product.promoStartAt.getTime() <= now &&
    product.promoEndAt.getTime() >= now;

  return {
    promotionActive,
    currentPrice: product.priceOnRequest
      ? null
      : promotionActive
        ? promoPrice
        : normalPrice,
  };
}

function serializeProduct(product: {
  id: number;
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
  imageUrl: string | null;
  media: Parameters<
    typeof serializeProductMediaLinks
  >[0];
  createdAt: Date;
  category: {
    id: number;
    name: string;
    slug: string;
  };
}) {
  const promotion =
    getPromotionState(product);

  const serializedMedia =
    serializeProductMediaLinks(
      product.media,
      {
        readyOnly: true,
      },
    );

  return {
    id: product.id,
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
    promotionActive: promotion.promotionActive,
    currentPrice: promotion.currentPrice,
    currency: product.currency,
    unit: product.unit,
    minOrderQty: product.minOrderQty,
    packSize: product.packSize,
    availability: product.availability,
    stockQuantity: product.stockQuantity,
    featured: product.featured,
    imageUrl:
      serializedMedia.mainMedia
        ?.secureUrl ??
      product.imageUrl,
    mainMedia:
      serializedMedia.mainMedia,
    galleryMedia:
      serializedMedia.galleryMedia,
    createdAt: product.createdAt,
    category: product.category,
  };
}

catalogRouter.get('/categories', async (_request, response) => {
  try {
    const categories = await prisma.category.findMany({
      where: {
        active: true,
      },
      orderBy: [
        {
          sortOrder: 'asc',
        },
        {
          name: 'asc',
        },
      ],
    });

    return response.json({
      data: categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        imageUrl: category.imageUrl,
        sortOrder: category.sortOrder,
      })),
    });
  } catch (error) {
    console.error('Erreur catalogue catégories :', error);

    return response.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Impossible de récupérer les catégories.',
    });
  }
});

catalogRouter.get('/products', async (request, response) => {
  const parsed = catalogQuerySchema.safeParse(request.query);

  if (!parsed.success) {
    return response.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Les filtres du catalogue sont invalides.',
      details: parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  const where: Prisma.ProductWhereInput = {
    status: 'PUBLISHED',
    category: {
      is: {
        active: true,
      },
    },
  };

  if (parsed.data.q) {
    where.OR = [
      {
        name: {
          contains: parsed.data.q,
        },
      },
      {
        brand: {
          contains: parsed.data.q,
        },
      },
      {
        sku: {
          contains: parsed.data.q,
        },
      },
      {
        shortDescription: {
          contains: parsed.data.q,
        },
      },
      {
        keywords: {
          contains: parsed.data.q,
        },
      },
    ];
  }

  if (parsed.data.category) {
    where.category = {
      is: {
        active: true,
        slug: parsed.data.category,
      },
    };
  }

  if (parsed.data.availability) {
    where.availability = parsed.data.availability;
  }

  if (parsed.data.featured !== undefined) {
    where.featured = parsed.data.featured;
  }

  if (
    parsed.data.minPrice !== undefined ||
    parsed.data.maxPrice !== undefined
  ) {
    where.price = {
      ...(parsed.data.minPrice !== undefined
        ? { gte: parsed.data.minPrice }
        : {}),
      ...(parsed.data.maxPrice !== undefined
        ? { lte: parsed.data.maxPrice }
        : {}),
    };
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput = {
    createdAt: 'desc',
  };

  if (parsed.data.sort === 'price_asc') {
    orderBy = {
      price: 'asc',
    };
  }

  if (parsed.data.sort === 'price_desc') {
    orderBy = {
      price: 'desc',
    };
  }

  if (parsed.data.sort === 'name_asc') {
    orderBy = {
      name: 'asc',
    };
  }

  try {
    const products = await prisma.product.findMany({
      where,
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
      orderBy,
      take: 100,
    });

    return response.json({
      data: products.map(serializeProduct),
      meta: {
        count: products.length,
      },
    });
  } catch (error) {
    console.error('Erreur catalogue produits :', error);

    return response.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Impossible de récupérer les produits.',
    });
  }
});

catalogRouter.get('/products/:slug', async (request, response) => {
  const slug = request.params.slug?.trim();

  if (!slug) {
    return response.status(400).json({
      error: 'INVALID_PRODUCT',
      message: 'Le produit demandé est invalide.',
    });
  }

  try {
    const product = await prisma.product.findFirst({
      where: {
        slug,
        status: 'PUBLISHED',
        category: {
          is: {
            active: true,
          },
        },
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

    if (!product) {
      return response.status(404).json({
        error: 'PRODUCT_NOT_FOUND',
        message: 'Ce produit est introuvable.',
      });
    }

    return response.json({
      data: serializeProduct(product),
    });
  } catch (error) {
    console.error('Erreur détail produit :', error);

    return response.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Impossible de récupérer ce produit.',
    });
  }
});
