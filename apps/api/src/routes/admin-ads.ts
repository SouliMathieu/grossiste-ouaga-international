import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAdmin } from '../middleware/require-admin.js';

export const adminAdsRouter = Router();

adminAdsRouter.use(requireAdmin);

const platformSchema = z.enum([
  'META',
  'GOOGLE',
]);

const campaignSchema = z
  .object({
    platform: platformSchema,

    productId: z
      .number()
      .int()
      .positive(),

    objective: z.enum([
      'WHATSAPP',
      'PRODUCT_VISITS',
      'SALES_CONVERSIONS',
    ]),

    budgetType: z.enum([
      'DAILY',
      'TOTAL',
    ]),

    budgetAmount: z
      .number()
      .int()
      .positive(),

    startAt: z.coerce.date(),

    endAt: z.coerce.date(),

    audienceZone: z
      .string()
      .trim()
      .min(2)
      .max(500),

    adText: z
      .string()
      .trim()
      .min(1)
      .max(5000),

    creativeMediaId: z
      .number()
      .int()
      .positive(),

    budgetConfirmed: z.literal(true),
  })
  .refine(
    (data) =>
      data.endAt.getTime() >
      data.startAt.getTime(),
    {
      path: ['endAt'],
      message:
        'La date de fin doit être postérieure à la date de début.',
    },
  );

function serializeDateTime(
  value: unknown,
) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);

    return Number.isNaN(
      parsed.getTime(),
    )
      ? null
      : parsed.toISOString();
  }

  return null;
}

function readBudgetLimit(
  name: string,
) {
  const raw = process.env[name];

  if (!raw) {
    return null;
  }

  const value = Number(raw);

  if (
    !Number.isInteger(value) ||
    value <= 0
  ) {
    return null;
  }

  return value;
}

function getPlatformPrerequisites(
  platform: 'META' | 'GOOGLE',
) {
  if (platform === 'META') {
    return {
      appConfigured: Boolean(
        process.env.META_APP_ID &&
          process.env.META_APP_SECRET,
      ),
      adAccountConfigured: Boolean(
        process.env.META_AD_ACCOUNT_ID,
      ),
    };
  }

  return {
    oauthConfigured: Boolean(
      process.env.GOOGLE_ADS_CLIENT_ID &&
        process.env
          .GOOGLE_ADS_CLIENT_SECRET,
    ),
    developerTokenConfigured:
      Boolean(
        process.env
          .GOOGLE_ADS_DEVELOPER_TOKEN,
      ),
    customerIdConfigured: Boolean(
      process.env
        .GOOGLE_ADS_CUSTOMER_ID,
    ),
  };
}

adminAdsRouter.get(
  '/integrations',
  async (_request, response) => {
    try {
      const stored =
        await prisma.adIntegration.findMany();

      const byPlatform = new Map(
        stored.map((item) => [
          item.platform,
          item,
        ]),
      );

      const data = (
        ['META', 'GOOGLE'] as const
      ).map((platform) => {
        const integration =
          byPlatform.get(platform);

        return {
          platform,
          status:
            integration?.status ??
            'NOT_CONNECTED',
          externalAccountId:
            integration
              ?.externalAccountId ??
            null,
          externalBusinessId:
            integration
              ?.externalBusinessId ??
            null,
          externalPageId:
            integration
              ?.externalPageId ??
            null,
          externalProfileId:
            integration
              ?.externalProfileId ??
            null,
          lastSyncAt:
            integration?.lastSyncAt ??
            null,
          lastError:
            integration?.lastError ??
            null,
          prerequisites:
            getPlatformPrerequisites(
              platform,
            ),
        };
      });

      return response.json({
        data,
      });
    } catch (error) {
      console.error(
        'Erreur intégrations publicitaires :',
        error,
      );

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message:
          'Impossible de récupérer les intégrations publicitaires.',
      });
    }
  },
);

adminAdsRouter.get(
  '/campaigns',
  async (_request, response) => {
    try {
      const campaigns =
        await prisma.adCampaign.findMany({
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                slug: true,
                name: true,
                status: true,
              },
            },
            metrics: {
              orderBy: {
                capturedAt: 'desc',
              },
              take: 1,
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 200,
        });

      return response.json({
        data: campaigns,
      });
    } catch (error) {
      console.error(
        'Erreur campagnes publicitaires :',
        error,
      );

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message:
          'Impossible de récupérer les campagnes.',
      });
    }
  },
);

adminAdsRouter.post(
  '/campaigns',
  async (request, response) => {
    const parsed =
      campaignSchema.safeParse(
        request.body,
      );

    if (!parsed.success) {
      return response.status(400).json({
        error: 'VALIDATION_ERROR',
        message:
          'Les paramètres de la campagne sont invalides.',
        details: parsed.error.issues,
      });
    }

    const data = parsed.data;

    const limit =
      data.budgetType === 'DAILY'
        ? readBudgetLimit(
            'ADS_MAX_DAILY_BUDGET_XOF',
          )
        : readBudgetLimit(
            'ADS_MAX_TOTAL_BUDGET_XOF',
          );

    if (
      limit !== null &&
      data.budgetAmount > limit
    ) {
      return response.status(400).json({
        error:
          'BUDGET_LIMIT_EXCEEDED',
        message:
          `Le budget dépasse la limite serveur autorisée de ${limit} XOF.`,
      });
    }

    try {
      const integration =
        await prisma.adIntegration.findUnique({
          where: {
            platform: data.platform,
          },
        });

      if (
        !integration ||
        integration.status !==
          'CONNECTED'
      ) {
        return response.status(409).json({
          error:
            'AD_INTEGRATION_NOT_CONNECTED',
          message:
            data.platform === 'META'
              ? 'Meta Ads n’est pas connecté.'
              : 'Google Ads n’est pas connecté.',
        });
      }

      const product =
        await prisma.product.findUnique({
          where: {
            id: data.productId,
          },
          select: {
            id: true,
            sku: true,
            slug: true,
            name: true,
            brand: true,
            price: true,
            priceOnRequest: true,
            promoPrice: true,
            promoStartsAt: true,
            promoEndsAt: true,
            status: true,
          },
        });

      if (!product) {
        return response.status(404).json({
          error: 'PRODUCT_NOT_FOUND',
          message:
            'Le produit sélectionné est introuvable.',
        });
      }

      if (
        product.status !== 'PUBLISHED'
      ) {
        return response.status(409).json({
          error:
            'PRODUCT_NOT_PUBLISHED',
          message:
            'Seul un produit publié peut être utilisé pour une publicité.',
        });
      }

      const media =
        await prisma.mediaAsset.findUnique({
          where: {
            id: data.creativeMediaId,
          },
          select: {
            id: true,
            publicId: true,
            secureUrl: true,
            resourceType: true,
            status: true,
            alt: true,
          },
        });

      if (
        !media ||
        media.status !== 'READY'
      ) {
        return response.status(400).json({
          error:
            'INVALID_AD_MEDIA',
          message:
            'L’image publicitaire sélectionnée est indisponible.',
        });
      }

      if (
        media.resourceType !== 'IMAGE'
      ) {
        return response.status(400).json({
          error:
            'INVALID_AD_MEDIA_TYPE',
          message:
            'Le créatif publicitaire doit être une image.',
        });
      }

      const campaign =
        await prisma.adCampaign.create({
          data: {
            platform:
              data.platform,
            productId:
              product.id,
            objective:
              data.objective,
            budgetType:
              data.budgetType,
            budgetAmount:
              data.budgetAmount,
            startAt:
              data.startAt,
            endAt:
              data.endAt,
            audienceZone:
              data.audienceZone,
            adText:
              data.adText,
            creativeMediaId:
              media.id,

            creativeSnapshot: {
              productId:
                product.id,
              sku:
                product.sku,
              slug:
                product.slug,
              name:
                product.name,
              brand:
                product.brand,
              price:
                product.price === null
                  ? null
                  : Number(
                      product.price,
                    ),
              priceOnRequest:
                product.priceOnRequest,
              promoPrice:
                product.promoPrice ===
                null
                  ? null
                  : Number(
                      product.promoPrice,
                    ),
              promoStartsAt:
                serializeDateTime(product.promoStartsAt),
              promoEndsAt:
                serializeDateTime(product.promoEndsAt),
              productUrl:
                `/produits/${product.slug}`,
              media: {
                id: media.id,
                publicId:
                  media.publicId,
                secureUrl:
                  media.secureUrl,
                alt:
                  media.alt,
              },
              audienceZone:
                data.audienceZone,
              adText:
                data.adText,
            },

            status: 'DRAFT',
          },
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                slug: true,
                name: true,
              },
            },
          },
        });

      /*
       * Important :
       * G1 n'appelle encore aucune API Meta ou Google.
       * Une campagne locale ne doit jamais être présentée
       * comme publiée tant que l'adapter fournisseur
       * n'a pas confirmé la création externe.
       */

      return response
        .status(201)
        .json({
          data: campaign,
        });
    } catch (error) {
      console.error(
        'Erreur création campagne :',
        error,
      );

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message:
          'Impossible de préparer la campagne publicitaire.',
      });
    }
  },
);

adminAdsRouter.get(
  '/campaigns/:id/metrics',
  async (request, response) => {
    const id = Number(
      request.params.id,
    );

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return response.status(400).json({
        error:
          'INVALID_CAMPAIGN_ID',
        message:
          'Identifiant de campagne invalide.',
      });
    }

    try {
      const campaign =
        await prisma.adCampaign.findUnique({
          where: {
            id,
          },
          select: {
            id: true,
          },
        });

      if (!campaign) {
        return response.status(404).json({
          error:
            'CAMPAIGN_NOT_FOUND',
          message:
            'Cette campagne est introuvable.',
        });
      }

      const metrics =
        await prisma.adMetricSnapshot.findMany({
          where: {
            campaignId: id,
          },
          orderBy: {
            capturedAt: 'desc',
          },
          take: 365,
        });

      return response.json({
        data: metrics,
      });
    } catch (error) {
      console.error(
        'Erreur métriques publicitaires :',
        error,
      );

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message:
          'Impossible de récupérer les métriques.',
      });
    }
  },
);
