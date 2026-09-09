import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { slugifyContent } from '../lib/content-slug.js';
import { requireAdmin } from '../middleware/require-admin.js';

export const adminContentRouter = Router();

adminContentRouter.use(requireAdmin);

const nullableText = (max: number) =>
  z
    .union([
      z.string().trim().max(max),
      z.literal(''),
      z.null(),
    ])
    .optional()
    .transform((value) => value || null);

const serviceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2)
    .max(191),
  shortDescription: nullableText(500),
  description: nullableText(10000),
  coverMediaId: z
    .number()
    .int()
    .positive()
    .nullable()
    .optional()
    .default(null),
  sortOrder: z
    .number()
    .int()
    .min(0)
    .default(0),
  active: z.boolean().default(true),
});

const realizationCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2)
    .max(120),
  description: nullableText(5000),
  sortOrder: z
    .number()
    .int()
    .min(0)
    .default(0),
  active: z.boolean().default(true),
});

function isUniqueConstraintError(
  error: unknown,
) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code ===
      'P2002'
  );
}

async function createServiceSlugged(
  data: z.infer<typeof serviceSchema>,
) {
  return prisma.$transaction(
    async (tx) => {
      const temporarySlug =
        `tmp-${randomUUID()}`;

      const created =
        await tx.service.create({
          data: {
            ...data,
            slug: temporarySlug,
          },
        });

      const base =
        slugifyContent(data.name);

      const collision =
        await tx.service.findFirst({
          where: {
            slug: base,
            NOT: {
              id: created.id,
            },
          },
          select: {
            id: true,
          },
        });

      const slug = collision
        ? `${base}-${created.id}`.slice(
            0,
            191,
          )
        : base;

      return tx.service.update({
        where: {
          id: created.id,
        },
        data: {
          slug,
        },
        include: {
          coverMedia: true,
        },
      });
    },
  );
}

async function createCategorySlugged(
  data: z.infer<
    typeof realizationCategorySchema
  >,
) {
  return prisma.$transaction(
    async (tx) => {
      const created =
        await tx.realizationCategory.create({
          data: {
            ...data,
            slug: `tmp-${randomUUID()}`.slice(
              0,
              140,
            ),
          },
        });

      const base =
        slugifyContent(data.name).slice(
          0,
          130,
        );

      const collision =
        await tx.realizationCategory.findFirst({
          where: {
            slug: base,
            NOT: {
              id: created.id,
            },
          },
          select: {
            id: true,
          },
        });

      const slug = collision
        ? `${base}-${created.id}`.slice(
            0,
            140,
          )
        : base;

      return tx.realizationCategory.update({
        where: {
          id: created.id,
        },
        data: {
          slug,
        },
      });
    },
  );
}

adminContentRouter.get(
  '/services',
  async (_request, response) => {
    try {
      const services =
        await prisma.service.findMany({
          include: {
            coverMedia: true,
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
        data: services,
      });
    } catch (error) {
      console.error(
        'Erreur services admin :',
        error,
      );

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message:
          'Impossible de récupérer les services.',
      });
    }
  },
);

adminContentRouter.post(
  '/services',
  async (request, response) => {
    const parsed =
      serviceSchema.safeParse(request.body);

    if (!parsed.success) {
      return response.status(400).json({
        error: 'VALIDATION_ERROR',
        message:
          'Les informations du service sont invalides.',
        details: parsed.error.issues,
      });
    }

    try {
      const service =
        await createServiceSlugged(
          parsed.data,
        );

      return response.status(201).json({
        data: service,
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return response.status(409).json({
          error: 'DUPLICATE_SERVICE',
          message:
            'Un service similaire existe déjà.',
        });
      }

      console.error(
        'Erreur création service :',
        error,
      );

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message:
          'Impossible de créer le service.',
      });
    }
  },
);

adminContentRouter.patch(
  '/services/:id',
  async (request, response) => {
    const id = Number(request.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return response.status(400).json({
        error: 'INVALID_SERVICE_ID',
        message:
          'Identifiant de service invalide.',
      });
    }

    const parsed =
      serviceSchema.safeParse(request.body);

    if (!parsed.success) {
      return response.status(400).json({
        error: 'VALIDATION_ERROR',
        message:
          'Les informations du service sont invalides.',
        details: parsed.error.issues,
      });
    }

    try {
      const existing =
        await prisma.service.findUnique({
          where: {
            id,
          },
        });

      if (!existing) {
        return response.status(404).json({
          error: 'SERVICE_NOT_FOUND',
          message:
            'Ce service est introuvable.',
        });
      }

      const service =
        await prisma.service.update({
          where: {
            id,
          },
          data: {
            ...parsed.data,
            slug: existing.slug,
          },
          include: {
            coverMedia: true,
          },
        });

      return response.json({
        data: service,
      });
    } catch (error) {
      console.error(
        'Erreur modification service :',
        error,
      );

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message:
          'Impossible de modifier le service.',
      });
    }
  },
);

adminContentRouter.delete(
  '/services/:id',
  async (request, response) => {
    const id = Number(request.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return response.status(400).json({
        error: 'INVALID_SERVICE_ID',
        message:
          'Identifiant de service invalide.',
      });
    }

    try {
      const service =
        await prisma.service.findUnique({
          where: {
            id,
          },
        });

      if (!service) {
        return response.status(404).json({
          error: 'SERVICE_NOT_FOUND',
          message:
            'Ce service est introuvable.',
        });
      }

      await prisma.service.update({
        where: {
          id,
        },
        data: {
          active: false,
        },
      });

      return response.status(204).send();
    } catch (error) {
      console.error(
        'Erreur masquage service :',
        error,
      );

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message:
          'Impossible de masquer le service.',
      });
    }
  },
);

adminContentRouter.get(
  '/realization-categories',
  async (_request, response) => {
    try {
      const categories =
        await prisma.realizationCategory.findMany({
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
        data: categories,
      });
    } catch (error) {
      console.error(
        'Erreur catégories réalisations admin :',
        error,
      );

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message:
          'Impossible de récupérer les catégories.',
      });
    }
  },
);

adminContentRouter.post(
  '/realization-categories',
  async (request, response) => {
    const parsed =
      realizationCategorySchema.safeParse(
        request.body,
      );

    if (!parsed.success) {
      return response.status(400).json({
        error: 'VALIDATION_ERROR',
        message:
          'Les informations de la catégorie sont invalides.',
        details: parsed.error.issues,
      });
    }

    try {
      const category =
        await createCategorySlugged(
          parsed.data,
        );

      return response.status(201).json({
        data: category,
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return response.status(409).json({
          error:
            'DUPLICATE_REALIZATION_CATEGORY',
          message:
            'Une catégorie similaire existe déjà.',
        });
      }

      console.error(
        'Erreur création catégorie réalisation :',
        error,
      );

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message:
          'Impossible de créer la catégorie.',
      });
    }
  },
);

adminContentRouter.patch(
  '/realization-categories/:id',
  async (request, response) => {
    const id = Number(request.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return response.status(400).json({
        error:
          'INVALID_REALIZATION_CATEGORY_ID',
        message:
          'Identifiant de catégorie invalide.',
      });
    }

    const parsed =
      realizationCategorySchema.safeParse(
        request.body,
      );

    if (!parsed.success) {
      return response.status(400).json({
        error: 'VALIDATION_ERROR',
        message:
          'Les informations de la catégorie sont invalides.',
        details: parsed.error.issues,
      });
    }

    try {
      const existing =
        await prisma.realizationCategory.findUnique({
          where: {
            id,
          },
        });

      if (!existing) {
        return response.status(404).json({
          error:
            'REALIZATION_CATEGORY_NOT_FOUND',
          message:
            'Cette catégorie est introuvable.',
        });
      }

      const category =
        await prisma.realizationCategory.update({
          where: {
            id,
          },
          data: {
            ...parsed.data,
            slug: existing.slug,
          },
        });

      return response.json({
        data: category,
      });
    } catch (error) {
      console.error(
        'Erreur modification catégorie réalisation :',
        error,
      );

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message:
          'Impossible de modifier la catégorie.',
      });
    }
  },
);

const technicalAttributeSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1)
    .max(120),
  value: z
    .string()
    .trim()
    .min(1)
    .max(500),
});

const realizationSchema = z.object({
  categoryId: z
    .number()
    .int()
    .positive(),

  serviceId: z
    .number()
    .int()
    .positive()
    .nullable()
    .optional()
    .default(null),

  title: z
    .string()
    .trim()
    .min(2)
    .max(191),

  location: nullableText(191),

  projectDate: z.coerce
    .date()
    .nullable()
    .optional()
    .default(null),

  projectYear: z
    .number()
    .int()
    .min(1900)
    .max(2100)
    .nullable()
    .optional()
    .default(null),

  summary: nullableText(500),

  description: nullableText(20000),

  technicalAttributes: z
    .array(technicalAttributeSchema)
    .max(50)
    .default([]),

  coverMediaId: z
    .number()
    .int()
    .positive()
    .nullable()
    .optional()
    .default(null),

  videoMediaId: z
    .number()
    .int()
    .positive()
    .nullable()
    .optional()
    .default(null),

  galleryMediaIds: z
    .array(
      z.number().int().positive(),
    )
    .max(30)
    .default([])
    .transform((ids) => [
      ...new Set(ids),
    ]),

  productIds: z
    .array(
      z.number().int().positive(),
    )
    .max(50)
    .default([])
    .transform((ids) => [
      ...new Set(ids),
    ]),

  featured: z.boolean().default(false),

  sortOrder: z
    .number()
    .int()
    .min(0)
    .default(0),

  status: z
    .enum([
      'DRAFT',
      'PUBLISHED',
    ])
    .default('DRAFT'),
});

const realizationInclude = {
  category: true,
  service: true,
  coverMedia: true,
  videoMedia: true,
  gallery: {
    include: {
      media: true,
    },
    orderBy: {
      sortOrder: 'asc' as const,
    },
  },
  products: {
    include: {
      product: true,
    },
    orderBy: {
      sortOrder: 'asc' as const,
    },
  },
} as const;

type RealizationInput =
  z.infer<typeof realizationSchema>;

async function validateRealizationRelations(
  data: RealizationInput,
) {
  const category =
    await prisma.realizationCategory.findUnique({
      where: {
        id: data.categoryId,
      },
    });

  if (!category) {
    return {
      error: 'UNKNOWN_REALIZATION_CATEGORY',
      message:
        'La catégorie sélectionnée est introuvable.',
    };
  }

  if (
    data.status === 'PUBLISHED' &&
    !category.active
  ) {
    return {
      error: 'INACTIVE_REALIZATION_CATEGORY',
      message:
        'Une réalisation publiée doit utiliser une catégorie active.',
    };
  }

  if (data.serviceId !== null) {
    const service =
      await prisma.service.findUnique({
        where: {
          id: data.serviceId,
        },
        select: {
          id: true,
        },
      });

    if (!service) {
      return {
        error: 'UNKNOWN_SERVICE',
        message:
          'Le service sélectionné est introuvable.',
      };
    }
  }

  const requestedMediaIds = [
    ...(data.coverMediaId
      ? [data.coverMediaId]
      : []),
    ...(data.videoMediaId
      ? [data.videoMediaId]
      : []),
    ...data.galleryMediaIds,
  ];

  const uniqueMediaIds = [
    ...new Set(requestedMediaIds),
  ];

  if (uniqueMediaIds.length > 0) {
    const media =
      await prisma.mediaAsset.findMany({
        where: {
          id: {
            in: uniqueMediaIds,
          },
        },
        select: {
          id: true,
          resourceType: true,
        },
      });

    if (
      media.length !==
      uniqueMediaIds.length
    ) {
      return {
        error: 'UNKNOWN_MEDIA',
        message:
          'Un ou plusieurs médias sont introuvables.',
      };
    }

    const mediaById = new Map(
      media.map((asset) => [
        asset.id,
        asset,
      ]),
    );

    if (
      data.coverMediaId &&
      mediaById.get(
        data.coverMediaId,
      )?.resourceType !== 'IMAGE'
    ) {
      return {
        error: 'INVALID_COVER_MEDIA',
        message:
          'La couverture doit être une image.',
      };
    }

    if (
      data.videoMediaId &&
      mediaById.get(
        data.videoMediaId,
      )?.resourceType !== 'VIDEO'
    ) {
      return {
        error: 'INVALID_VIDEO_MEDIA',
        message:
          'La vidéo sélectionnée doit être un média vidéo.',
      };
    }

    const invalidGallery =
      data.galleryMediaIds.some(
        (id) =>
          mediaById.get(id)
            ?.resourceType !== 'IMAGE',
      );

    if (invalidGallery) {
      return {
        error: 'INVALID_GALLERY_MEDIA',
        message:
          'La galerie doit uniquement contenir des images.',
      };
    }
  }

  if (data.productIds.length > 0) {
    const products =
      await prisma.product.findMany({
        where: {
          id: {
            in: data.productIds,
          },
        },
        select: {
          id: true,
        },
      });

    if (
      products.length !==
      data.productIds.length
    ) {
      return {
        error: 'UNKNOWN_PRODUCT',
        message:
          'Un ou plusieurs produits associés sont introuvables.',
      };
    }
  }

  return null;
}

adminContentRouter.get(
  '/realizations',
  async (_request, response) => {
    try {
      const realizations =
        await prisma.realization.findMany({
          include: realizationInclude,
          orderBy: [
            {
              sortOrder: 'asc',
            },
            {
              updatedAt: 'desc',
            },
          ],
          take: 200,
        });

      return response.json({
        data: realizations,
      });
    } catch (error) {
      console.error(
        'Erreur réalisations admin :',
        error,
      );

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message:
          'Impossible de récupérer les réalisations.',
      });
    }
  },
);

adminContentRouter.post(
  '/realizations',
  async (request, response) => {
    const parsed =
      realizationSchema.safeParse(
        request.body,
      );

    if (!parsed.success) {
      return response.status(400).json({
        error: 'VALIDATION_ERROR',
        message:
          'Les informations de la réalisation sont invalides.',
        details: parsed.error.issues,
      });
    }

    try {
      const relationError =
        await validateRealizationRelations(
          parsed.data,
        );

      if (relationError) {
        return response.status(400).json(
          relationError,
        );
      }

      const {
        galleryMediaIds,
        productIds,
        ...data
      } = parsed.data;

      const realization =
        await prisma.$transaction(
          async (tx) => {
            const created =
              await tx.realization.create({
                data: {
                  ...data,
                  slug: `tmp-${randomUUID()}`,
                },
              });

            const base =
              slugifyContent(
                data.title,
              );

            const collision =
              await tx.realization.findFirst({
                where: {
                  slug: base,
                  NOT: {
                    id: created.id,
                  },
                },
                select: {
                  id: true,
                },
              });

            const slug = collision
              ? `${base}-${created.id}`.slice(
                  0,
                  191,
                )
              : base;

            await tx.realization.update({
              where: {
                id: created.id,
              },
              data: {
                slug,
              },
            });

            if (
              galleryMediaIds.length > 0
            ) {
              await tx.realizationMedia.createMany({
                data:
                  galleryMediaIds.map(
                    (mediaId, index) => ({
                      realizationId:
                        created.id,
                      mediaId,
                      sortOrder: index,
                    }),
                  ),
              });
            }

            if (productIds.length > 0) {
              await tx.realizationProduct.createMany({
                data: productIds.map(
                  (productId, index) => ({
                    realizationId:
                      created.id,
                    productId,
                    sortOrder: index,
                  }),
                ),
              });
            }

            return tx.realization.findUniqueOrThrow({
              where: {
                id: created.id,
              },
              include:
                realizationInclude,
            });
          },
        );

      return response.status(201).json({
        data: realization,
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return response.status(409).json({
          error: 'DUPLICATE_REALIZATION',
          message:
            'Une réalisation similaire existe déjà.',
        });
      }

      console.error(
        'Erreur création réalisation :',
        error,
      );

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message:
          'Impossible de créer la réalisation.',
      });
    }
  },
);

adminContentRouter.patch(
  '/realizations/:id',
  async (request, response) => {
    const id = Number(request.params.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return response.status(400).json({
        error: 'INVALID_REALIZATION_ID',
        message:
          'Identifiant de réalisation invalide.',
      });
    }

    const parsed =
      realizationSchema.safeParse(
        request.body,
      );

    if (!parsed.success) {
      return response.status(400).json({
        error: 'VALIDATION_ERROR',
        message:
          'Les informations de la réalisation sont invalides.',
        details: parsed.error.issues,
      });
    }

    try {
      const existing =
        await prisma.realization.findUnique({
          where: {
            id,
          },
        });

      if (!existing) {
        return response.status(404).json({
          error: 'REALIZATION_NOT_FOUND',
          message:
            'Cette réalisation est introuvable.',
        });
      }

      const relationError =
        await validateRealizationRelations(
          parsed.data,
        );

      if (relationError) {
        return response.status(400).json(
          relationError,
        );
      }

      const {
        galleryMediaIds,
        productIds,
        ...data
      } = parsed.data;

      const realization =
        await prisma.$transaction(
          async (tx) => {
            await tx.realization.update({
              where: {
                id,
              },
              data: {
                ...data,
                slug: existing.slug,
              },
            });

            await tx.realizationMedia.deleteMany({
              where: {
                realizationId: id,
              },
            });

            await tx.realizationProduct.deleteMany({
              where: {
                realizationId: id,
              },
            });

            if (
              galleryMediaIds.length > 0
            ) {
              await tx.realizationMedia.createMany({
                data:
                  galleryMediaIds.map(
                    (mediaId, index) => ({
                      realizationId: id,
                      mediaId,
                      sortOrder: index,
                    }),
                  ),
              });
            }

            if (productIds.length > 0) {
              await tx.realizationProduct.createMany({
                data: productIds.map(
                  (productId, index) => ({
                    realizationId: id,
                    productId,
                    sortOrder: index,
                  }),
                ),
              });
            }

            return tx.realization.findUniqueOrThrow({
              where: {
                id,
              },
              include:
                realizationInclude,
            });
          },
        );

      return response.json({
        data: realization,
      });
    } catch (error) {
      console.error(
        'Erreur modification réalisation :',
        error,
      );

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message:
          'Impossible de modifier la réalisation.',
      });
    }
  },
);

adminContentRouter.delete(
  '/realizations/:id',
  async (request, response) => {
    const id = Number(request.params.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return response.status(400).json({
        error: 'INVALID_REALIZATION_ID',
        message:
          'Identifiant de réalisation invalide.',
      });
    }

    try {
      const existing =
        await prisma.realization.findUnique({
          where: {
            id,
          },
          select: {
            id: true,
          },
        });

      if (!existing) {
        return response.status(404).json({
          error: 'REALIZATION_NOT_FOUND',
          message:
            'Cette réalisation est introuvable.',
        });
      }

      await prisma.realization.update({
        where: {
          id,
        },
        data: {
          status: 'DRAFT',
          featured: false,
        },
      });

      return response.status(204).send();
    } catch (error) {
      console.error(
        'Erreur retrait réalisation :',
        error,
      );

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message:
          'Impossible de retirer la réalisation.',
      });
    }
  },
);
