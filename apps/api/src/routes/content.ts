import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const contentRouter = Router();

const mediaSelect = {
  id: true,
  publicId: true,
  secureUrl: true,
  resourceType: true,
  width: true,
  height: true,
  format: true,
  alt: true,
  caption: true,
} as const;

contentRouter.get(
  '/services',
  async (_request, response) => {
    try {
      const services = await prisma.service.findMany({
        where: {
          active: true,
        },
        include: {
          coverMedia: {
            select: mediaSelect,
          },
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
        'Erreur liste services publics :',
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

contentRouter.get(
  '/services/:slug',
  async (request, response) => {
    const slug = request.params.slug?.trim();

    if (!slug) {
      return response.status(400).json({
        error: 'INVALID_SERVICE',
        message: 'Le service demandé est invalide.',
      });
    }

    try {
      const service =
        await prisma.service.findFirst({
          where: {
            slug,
            active: true,
          },
          include: {
            coverMedia: {
              select: mediaSelect,
            },
            gallery: {
              include: {
                media: {
                  select: mediaSelect,
                },
              },
              orderBy: {
                sortOrder: 'asc',
              },
            },
            products: {
              include: {
                product: {
                  include: {
                    category: {
                      select: {
                        id: true,
                        name: true,
                        slug: true,
                      },
                    },
                  },
                },
              },
              orderBy: {
                sortOrder: 'asc',
              },
            },
          },
        });

      if (!service) {
        return response.status(404).json({
          error: 'SERVICE_NOT_FOUND',
          message: 'Ce service est introuvable.',
        });
      }

      return response.json({
        data: {
          ...service,
          products: service.products
            .filter(
              (link) =>
                link.product.status ===
                'PUBLISHED',
            )
            .map((link) => link.product),
        },
      });
    } catch (error) {
      console.error(
        'Erreur détail service public :',
        error,
      );

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message:
          'Impossible de récupérer ce service.',
      });
    }
  },
);

contentRouter.get(
  '/realisation-categories',
  async (_request, response) => {
    try {
      const categories =
        await prisma.realizationCategory.findMany({
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
        data: categories,
      });
    } catch (error) {
      console.error(
        'Erreur catégories réalisations :',
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

contentRouter.get(
  '/realisations',
  async (_request, response) => {
    try {
      const realizations =
        await prisma.realization.findMany({
          where: {
            status: 'PUBLISHED',
            category: {
              active: true,
            },
          },
          include: {
            category: true,
            service: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            coverMedia: {
              select: mediaSelect,
            },
          },
          orderBy: [
            {
              featured: 'desc',
            },
            {
              sortOrder: 'asc',
            },
            {
              createdAt: 'desc',
            },
          ],
        });

      return response.json({
        data: realizations,
      });
    } catch (error) {
      console.error(
        'Erreur liste réalisations publiques :',
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

contentRouter.get(
  '/realisations/:slug',
  async (request, response) => {
    const slug = request.params.slug?.trim();

    if (!slug) {
      return response.status(400).json({
        error: 'INVALID_REALIZATION',
        message:
          'La réalisation demandée est invalide.',
      });
    }

    try {
      const realization =
        await prisma.realization.findFirst({
          where: {
            slug,
            status: 'PUBLISHED',
            category: {
              active: true,
            },
          },
          include: {
            category: true,
            service: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            coverMedia: {
              select: mediaSelect,
            },
            videoMedia: {
              select: mediaSelect,
            },
            gallery: {
              include: {
                media: {
                  select: mediaSelect,
                },
              },
              orderBy: {
                sortOrder: 'asc',
              },
            },
            products: {
              include: {
                product: true,
              },
              orderBy: {
                sortOrder: 'asc',
              },
            },
          },
        });

      if (!realization) {
        return response.status(404).json({
          error: 'REALIZATION_NOT_FOUND',
          message:
            'Cette réalisation est introuvable.',
        });
      }

      return response.json({
        data: {
          ...realization,
          products: realization.products
            .filter(
              (link) =>
                link.product.status ===
                'PUBLISHED',
            )
            .map((link) => link.product),
        },
      });
    } catch (error) {
      console.error(
        'Erreur détail réalisation publique :',
        error,
      );

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message:
          'Impossible de récupérer cette réalisation.',
      });
    }
  },
);

contentRouter.get(
  '/company',
  async (_request, response) => {
    try {
      const company =
        await prisma.companySettings.findUnique({
          where: {
            id: 1,
          },
          include: {
            logoMedia: {
              select: mediaSelect,
            },
            faviconMedia: {
              select: mediaSelect,
            },
          },
        });

      return response.json({
        data: company,
      });
    } catch (error) {
      console.error(
        'Erreur informations entreprise :',
        error,
      );

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message:
          'Impossible de récupérer les informations de l’entreprise.',
      });
    }
  },
);

contentRouter.get(
  '/about',
  async (_request, response) => {
    try {
      const about =
        await prisma.aboutContent.findUnique({
          where: {
            id: 1,
          },
          include: {
            heroVideo: {
              select: mediaSelect,
            },
            heroPoster: {
              select: mediaSelect,
            },
            introMedia: {
              select: mediaSelect,
            },
            missionMedia: {
              select: mediaSelect,
            },
            strengthsMedia: {
              select: mediaSelect,
            },
          },
        });

      return response.json({
        data: about,
      });
    } catch (error) {
      console.error(
        'Erreur contenu À propos :',
        error,
      );

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message:
          'Impossible de récupérer le contenu À propos.',
      });
    }
  },
);

contentRouter.get(
  '/home',
  async (_request, response) => {
    try {
      const [
        slides,
        trustCards,
        services,
        realizations,
      ] = await Promise.all([
        prisma.homeSlide.findMany({
          where: {
            active: true,
          },
          include: {
            imageMedia: {
              select: mediaSelect,
            },
          },
          orderBy: {
            sortOrder: 'asc',
          },
          take: 4,
        }),

        prisma.trustCard.findMany({
          where: {
            active: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        }),

        prisma.service.findMany({
          where: {
            active: true,
          },
          include: {
            coverMedia: {
              select: mediaSelect,
            },
          },
          orderBy: {
            sortOrder: 'asc',
          },
          take: 4,
        }),

        prisma.realization.findMany({
          where: {
            status: 'PUBLISHED',
            featured: true,
            category: {
              active: true,
            },
          },
          include: {
            category: true,
            coverMedia: {
              select: mediaSelect,
            },
          },
          orderBy: [
            {
              sortOrder: 'asc',
            },
            {
              createdAt: 'desc',
            },
          ],
          take: 4,
        }),
      ]);

      return response.json({
        data: {
          slides,
          trustCards,
          services,
          realizations,
        },
      });
    } catch (error) {
      console.error(
        'Erreur contenu accueil :',
        error,
      );

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message:
          'Impossible de récupérer le contenu de l’accueil.',
      });
    }
  },
);
