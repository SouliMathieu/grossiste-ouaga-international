import { Router } from 'express';
import { z } from 'zod';
import {
  wouldExceedActiveHomeSlideLimit,
} from '../lib/home-slides.js';
import { prisma } from '../lib/prisma.js';
import { requireAdmin } from '../middleware/require-admin.js';

export const adminSiteContentRouter =
  Router();

adminSiteContentRouter.use(requireAdmin);

const nullableText = (max: number) =>
  z
    .union([
      z.string().trim().max(max),
      z.literal(''),
      z.null(),
    ])
    .optional()
    .transform((value) => value || null);

const nullableUrl = z
  .union([
    z.string().trim().url().max(2000),
    z.literal(''),
    z.null(),
  ])
  .optional()
  .transform((value) => value || null);

const nullablePositiveId = z
  .number()
  .int()
  .positive()
  .nullable()
  .optional()
  .default(null);

const homeSlideSchema = z.object({
  imageMediaId: nullablePositiveId,

  eyebrow: nullableText(120),

  title: z
    .string()
    .trim()
    .min(2)
    .max(191),

  text: nullableText(500),

  ctaLabel: nullableText(120),

  ctaUrl: nullableText(2000),

  active: z.boolean().default(true),

  sortOrder: z
    .number()
    .int()
    .min(0)
    .default(0),
});

const trustCardSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2)
    .max(120),

  text: nullableText(500),

  iconKey: nullableText(80),

  active: z.boolean().default(true),

  sortOrder: z
    .number()
    .int()
    .min(0)
    .default(0),
});

const companySchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(2)
    .max(191),

  address: nullableText(5000),
  city: nullableText(120),
  phone: nullableText(32),
  whatsapp: nullableText(32),

  email: z
    .union([
      z.string().trim().email().max(191),
      z.literal(''),
      z.null(),
    ])
    .optional()
    .transform((value) => value || null),

  hoursText: nullableText(5000),

  mapsUrl: nullableUrl,

  latitude: z
    .number()
    .min(-90)
    .max(90)
    .nullable()
    .optional()
    .default(null),

  longitude: z
    .number()
    .min(-180)
    .max(180)
    .nullable()
    .optional()
    .default(null),

  facebookUrl: nullableUrl,
  instagramUrl: nullableUrl,
  linkedinUrl: nullableUrl,
  youtubeUrl: nullableUrl,
  tiktokUrl: nullableUrl,

  logoMediaId: nullablePositiveId,
  faviconMediaId: nullablePositiveId,
});

const aboutItemSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1)
    .max(120),

  text: z
    .string()
    .trim()
    .min(1)
    .max(1000),
});

const aboutSchema = z.object({
  heroTitle: nullableText(191),
  heroText: nullableText(10000),

  heroVideoMediaId:
    nullablePositiveId,

  heroPosterMediaId:
    nullablePositiveId,

  introTitle: nullableText(191),
  introText: nullableText(10000),
  introMediaId: nullablePositiveId,

  implantationTitle:
    nullableText(191),

  implantationText:
    nullableText(10000),

  missionTitle: nullableText(191),
  missionText: nullableText(10000),
  missionMediaId: nullablePositiveId,

  valuesTitle: nullableText(191),

  values: z
    .array(aboutItemSchema)
    .max(20)
    .default([]),

  strengthsTitle: nullableText(191),

  strengths: z
    .array(aboutItemSchema)
    .max(20)
    .default([]),

  strengthsMediaId:
    nullablePositiveId,
});

const messageStatusSchema = z.enum([
  'UNREAD',
  'READ',
  'ARCHIVED',
]);

type MediaExpectation = {
  id: number | null | undefined;
  type: 'IMAGE' | 'VIDEO';
};

async function validateMediaExpectations(
  expectations: MediaExpectation[],
) {
  const used = expectations.filter(
    (
      expectation,
    ): expectation is {
      id: number;
      type: 'IMAGE' | 'VIDEO';
    } =>
      typeof expectation.id === 'number',
  );

  if (used.length === 0) {
    return null;
  }

  const ids = [
    ...new Set(
      used.map(
        (expectation) =>
          expectation.id,
      ),
    ),
  ];

  const assets =
    await prisma.mediaAsset.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      select: {
        id: true,
        resourceType: true,
      },
    });

  if (assets.length !== ids.length) {
    return {
      error: 'UNKNOWN_MEDIA',
      message:
        'Un ou plusieurs médias sont introuvables.',
    };
  }

  const byId = new Map(
    assets.map((asset) => [
      asset.id,
      asset.resourceType,
    ]),
  );

  for (const expectation of used) {
    if (
      byId.get(expectation.id) !==
      expectation.type
    ) {
      return {
        error: 'INVALID_MEDIA_TYPE',
        message:
          expectation.type === 'VIDEO'
            ? 'Le média sélectionné doit être une vidéo.'
            : 'Le média sélectionné doit être une image.',
      };
    }
  }

  return null;
}

/*
 * HOME SLIDES
 */

adminSiteContentRouter.get(
  '/home/slides',
  async (_request, response) => {
    try {
      const slides =
        await prisma.homeSlide.findMany({
          include: {
            imageMedia: true,
          },
          orderBy: [
            {
              sortOrder: 'asc',
            },
            {
              id: 'asc',
            },
          ],
        });

      return response.json({
        data: slides,
      });
    } catch (error) {
      console.error(
        'Erreur slides accueil admin :',
        error,
      );

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message:
          'Impossible de récupérer les slides.',
      });
    }
  },
);

adminSiteContentRouter.post(
  '/home/slides',
  async (request, response) => {
    const parsed =
      homeSlideSchema.safeParse(
        request.body,
      );

    if (!parsed.success) {
      return response.status(400).json({
        error: 'VALIDATION_ERROR',
        message:
          'Les informations de la slide sont invalides.',
        details: parsed.error.issues,
      });
    }

    try {
      const mediaError =
        await validateMediaExpectations([
          {
            id: parsed.data.imageMediaId,
            type: 'IMAGE',
          },
        ]);

      if (mediaError) {
        return response
          .status(400)
          .json(mediaError);
      }

      const activeCount =
        await prisma.homeSlide.count({
          where: {
            active: true,
          },
        });

      if (
        wouldExceedActiveHomeSlideLimit(
          activeCount,
          parsed.data.active,
        )
      ) {
        return response.status(409).json({
          error:
            'HOME_SLIDE_LIMIT_REACHED',
          message:
            'L’accueil ne peut pas contenir plus de 4 slides actives.',
        });
      }

      const slide =
        await prisma.homeSlide.create({
          data: parsed.data,
          include: {
            imageMedia: true,
          },
        });

      return response.status(201).json({
        data: slide,
      });
    } catch (error) {
      console.error(
        'Erreur création slide accueil :',
        error,
      );

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message:
          'Impossible de créer la slide.',
      });
    }
  },
);

adminSiteContentRouter.patch(
  '/home/slides/:id',
  async (request, response) => {
    const id = Number(request.params.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return response.status(400).json({
        error: 'INVALID_HOME_SLIDE_ID',
        message:
          'Identifiant de slide invalide.',
      });
    }

    const parsed =
      homeSlideSchema.safeParse(
        request.body,
      );

    if (!parsed.success) {
      return response.status(400).json({
        error: 'VALIDATION_ERROR',
        message:
          'Les informations de la slide sont invalides.',
        details: parsed.error.issues,
      });
    }

    try {
      const existing =
        await prisma.homeSlide.findUnique({
          where: {
            id,
          },
        });

      if (!existing) {
        return response.status(404).json({
          error: 'HOME_SLIDE_NOT_FOUND',
          message:
            'Cette slide est introuvable.',
        });
      }

      const mediaError =
        await validateMediaExpectations([
          {
            id: parsed.data.imageMediaId,
            type: 'IMAGE',
          },
        ]);

      if (mediaError) {
        return response
          .status(400)
          .json(mediaError);
      }

      const activeCount =
        await prisma.homeSlide.count({
          where: {
            active: true,
          },
        });

      if (
        wouldExceedActiveHomeSlideLimit(
          activeCount,
          parsed.data.active,
          existing.active,
        )
      ) {
        return response.status(409).json({
          error:
            'HOME_SLIDE_LIMIT_REACHED',
          message:
            'L’accueil ne peut pas contenir plus de 4 slides actives.',
        });
      }

      const slide =
        await prisma.homeSlide.update({
          where: {
            id,
          },
          data: parsed.data,
          include: {
            imageMedia: true,
          },
        });

      return response.json({
        data: slide,
      });
    } catch (error) {
      console.error(
        'Erreur modification slide accueil :',
        error,
      );

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message:
          'Impossible de modifier la slide.',
      });
    }
  },
);

adminSiteContentRouter.delete(
  '/home/slides/:id',
  async (request, response) => {
    const id = Number(request.params.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return response.status(400).json({
        error: 'INVALID_HOME_SLIDE_ID',
        message:
          'Identifiant de slide invalide.',
      });
    }

    try {
      const result =
        await prisma.homeSlide.updateMany({
          where: {
            id,
          },
          data: {
            active: false,
          },
        });

      if (result.count === 0) {
        return response.status(404).json({
          error: 'HOME_SLIDE_NOT_FOUND',
          message:
            'Cette slide est introuvable.',
        });
      }

      return response.status(204).send();
    } catch (error) {
      console.error(
        'Erreur masquage slide accueil :',
        error,
      );

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message:
          'Impossible de masquer la slide.',
      });
    }
  },
);

/*
 * TRUST CARDS
 */

adminSiteContentRouter.get(
  '/home/trust-cards',
  async (_request, response) => {
    try {
      const cards =
        await prisma.trustCard.findMany({
          orderBy: [
            {
              sortOrder: 'asc',
            },
            {
              id: 'asc',
            },
          ],
        });

      return response.json({
        data: cards,
      });
    } catch (error) {
      console.error(
        'Erreur cartes confiance admin :',
        error,
      );

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message:
          'Impossible de récupérer les cartes de confiance.',
      });
    }
  },
);

adminSiteContentRouter.post(
  '/home/trust-cards',
  async (request, response) => {
    const parsed =
      trustCardSchema.safeParse(
        request.body,
      );

    if (!parsed.success) {
      return response.status(400).json({
        error: 'VALIDATION_ERROR',
        message:
          'Les informations de la carte sont invalides.',
        details: parsed.error.issues,
      });
    }

    try {
      const card =
        await prisma.trustCard.create({
          data: parsed.data,
        });

      return response.status(201).json({
        data: card,
      });
    } catch (error) {
      console.error(
        'Erreur création carte confiance :',
        error,
      );

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message:
          'Impossible de créer la carte de confiance.',
      });
    }
  },
);

adminSiteContentRouter.patch(
  '/home/trust-cards/:id',
  async (request, response) => {
    const id = Number(request.params.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return response.status(400).json({
        error: 'INVALID_TRUST_CARD_ID',
        message:
          'Identifiant de carte invalide.',
      });
    }

    const parsed =
      trustCardSchema.safeParse(
        request.body,
      );

    if (!parsed.success) {
      return response.status(400).json({
        error: 'VALIDATION_ERROR',
        message:
          'Les informations de la carte sont invalides.',
        details: parsed.error.issues,
      });
    }

    try {
      const existing =
        await prisma.trustCard.findUnique({
          where: {
            id,
          },
        });

      if (!existing) {
        return response.status(404).json({
          error: 'TRUST_CARD_NOT_FOUND',
          message:
            'Cette carte est introuvable.',
        });
      }

      const card =
        await prisma.trustCard.update({
          where: {
            id,
          },
          data: parsed.data,
        });

      return response.json({
        data: card,
      });
    } catch (error) {
      console.error(
        'Erreur modification carte confiance :',
        error,
      );

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message:
          'Impossible de modifier la carte de confiance.',
      });
    }
  },
);

adminSiteContentRouter.delete(
  '/home/trust-cards/:id',
  async (request, response) => {
    const id = Number(request.params.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return response.status(400).json({
        error: 'INVALID_TRUST_CARD_ID',
        message:
          'Identifiant de carte invalide.',
      });
    }

    try {
      const result =
        await prisma.trustCard.updateMany({
          where: {
            id,
          },
          data: {
            active: false,
          },
        });

      if (result.count === 0) {
        return response.status(404).json({
          error: 'TRUST_CARD_NOT_FOUND',
          message:
            'Cette carte est introuvable.',
        });
      }

      return response.status(204).send();
    } catch (error) {
      console.error(
        'Erreur masquage carte confiance :',
        error,
      );

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message:
          'Impossible de masquer la carte de confiance.',
      });
    }
  },
);

/*
 * COMPANY SETTINGS
 */

adminSiteContentRouter.get(
  '/company',
  async (_request, response) => {
    try {
      const company =
        await prisma.companySettings.findUnique({
          where: {
            id: 1,
          },
          include: {
            logoMedia: true,
            faviconMedia: true,
          },
        });

      return response.json({
        data: company,
      });
    } catch (error) {
      console.error(
        'Erreur entreprise admin :',
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

adminSiteContentRouter.put(
  '/company',
  async (request, response) => {
    const parsed =
      companySchema.safeParse(
        request.body,
      );

    if (!parsed.success) {
      return response.status(400).json({
        error: 'VALIDATION_ERROR',
        message:
          'Les informations de l’entreprise sont invalides.',
        details: parsed.error.issues,
      });
    }

    try {
      const mediaError =
        await validateMediaExpectations([
          {
            id: parsed.data.logoMediaId,
            type: 'IMAGE',
          },
          {
            id:
              parsed.data
                .faviconMediaId,
            type: 'IMAGE',
          },
        ]);

      if (mediaError) {
        return response
          .status(400)
          .json(mediaError);
      }

      const company =
        await prisma.companySettings.upsert({
          where: {
            id: 1,
          },
          create: {
            id: 1,
            ...parsed.data,
          },
          update: parsed.data,
          include: {
            logoMedia: true,
            faviconMedia: true,
          },
        });

      return response.json({
        data: company,
      });
    } catch (error) {
      console.error(
        'Erreur sauvegarde entreprise :',
        error,
      );

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message:
          'Impossible d’enregistrer les informations de l’entreprise.',
      });
    }
  },
);

/*
 * ABOUT
 */

adminSiteContentRouter.get(
  '/about',
  async (_request, response) => {
    try {
      const about =
        await prisma.aboutContent.findUnique({
          where: {
            id: 1,
          },
          include: {
            heroVideo: true,
            heroPoster: true,
            introMedia: true,
            missionMedia: true,
            strengthsMedia: true,
          },
        });

      return response.json({
        data: about,
      });
    } catch (error) {
      console.error(
        'Erreur À propos admin :',
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

adminSiteContentRouter.put(
  '/about',
  async (request, response) => {
    const parsed =
      aboutSchema.safeParse(
        request.body,
      );

    if (!parsed.success) {
      return response.status(400).json({
        error: 'VALIDATION_ERROR',
        message:
          'Le contenu À propos est invalide.',
        details: parsed.error.issues,
      });
    }

    try {
      const mediaError =
        await validateMediaExpectations([
          {
            id:
              parsed.data
                .heroVideoMediaId,
            type: 'VIDEO',
          },
          {
            id:
              parsed.data
                .heroPosterMediaId,
            type: 'IMAGE',
          },
          {
            id:
              parsed.data.introMediaId,
            type: 'IMAGE',
          },
          {
            id:
              parsed.data
                .missionMediaId,
            type: 'IMAGE',
          },
          {
            id:
              parsed.data
                .strengthsMediaId,
            type: 'IMAGE',
          },
        ]);

      if (mediaError) {
        return response
          .status(400)
          .json(mediaError);
      }

      const about =
        await prisma.aboutContent.upsert({
          where: {
            id: 1,
          },
          create: {
            id: 1,
            ...parsed.data,
          },
          update: parsed.data,
          include: {
            heroVideo: true,
            heroPoster: true,
            introMedia: true,
            missionMedia: true,
            strengthsMedia: true,
          },
        });

      return response.json({
        data: about,
      });
    } catch (error) {
      console.error(
        'Erreur sauvegarde À propos :',
        error,
      );

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message:
          'Impossible d’enregistrer le contenu À propos.',
      });
    }
  },
);

/*
 * CONTACT MESSAGES
 */

adminSiteContentRouter.get(
  '/messages',
  async (request, response) => {
    const statusResult =
      messageStatusSchema
        .optional()
        .safeParse(
          request.query.status,
        );

    if (!statusResult.success) {
      return response.status(400).json({
        error: 'INVALID_MESSAGE_STATUS',
        message:
          'Le statut de message est invalide.',
      });
    }

    try {
      const messages =
        await prisma.contactMessage.findMany({
          ...(statusResult.data
            ? {
                where: {
                  status:
                    statusResult.data,
                },
              }
            : {}),
          orderBy: {
            createdAt: 'desc',
          },
          take: 200,
        });

      return response.json({
        data: messages,
      });
    } catch (error) {
      console.error(
        'Erreur messages contact admin :',
        error,
      );

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message:
          'Impossible de récupérer les messages.',
      });
    }
  },
);

adminSiteContentRouter.patch(
  '/messages/:id/status',
  async (request, response) => {
    const id = Number(request.params.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return response.status(400).json({
        error: 'INVALID_MESSAGE_ID',
        message:
          'Identifiant de message invalide.',
      });
    }

    const parsed = z
      .object({
        status:
          messageStatusSchema,
      })
      .safeParse(request.body);

    if (!parsed.success) {
      return response.status(400).json({
        error: 'VALIDATION_ERROR',
        message:
          'Le statut du message est invalide.',
      });
    }

    try {
      const existing =
        await prisma.contactMessage.findUnique({
          where: {
            id,
          },
        });

      if (!existing) {
        return response.status(404).json({
          error: 'MESSAGE_NOT_FOUND',
          message:
            'Ce message est introuvable.',
        });
      }

      const message =
        await prisma.contactMessage.update({
          where: {
            id,
          },
          data: {
            status:
              parsed.data.status,
          },
        });

      return response.json({
        data: message,
      });
    } catch (error) {
      console.error(
        'Erreur statut message contact :',
        error,
      );

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message:
          'Impossible de modifier le message.',
      });
    }
  },
);
