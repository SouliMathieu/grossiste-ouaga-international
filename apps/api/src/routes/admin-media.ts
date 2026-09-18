import type {
  NextFunction,
  Request,
  Response,
} from 'express';
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import {
  destroyMediaAsset,
  isCloudinaryConfigured,
  uploadMediaBuffer,
} from '../lib/cloudinary.js';
import {
  ABSOLUTE_MEDIA_MAX_BYTES,
  MEDIA_FOLDER_BY_SCOPE,
  MEDIA_SCOPES,
  getMediaResourceType,
  isMediaSizeAllowed,
  toCloudinaryResourceType,
} from '../lib/media-policy.js';
import { prisma } from '../lib/prisma.js';
import { requireAdmin } from '../middleware/require-admin.js';

export const adminMediaRouter =
  Router();

adminMediaRouter.use(requireAdmin);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 1,
    fileSize:
      ABSOLUTE_MEDIA_MAX_BYTES,
  },
  fileFilter(
    _request,
    file,
    callback,
  ) {
    if (
      !getMediaResourceType(
        file.mimetype,
      )
    ) {
      callback(
        new Error(
          'UNSUPPORTED_MEDIA_TYPE',
        ),
      );
      return;
    }

    callback(null, true);
  },
});

const uploadMetadataSchema = z.object({
  scope: z.enum(MEDIA_SCOPES),

  alt: z
    .string()
    .trim()
    .max(255)
    .optional()
    .transform(
      (value) => value || null,
    ),

  caption: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform(
      (value) => value || null,
    ),
});

const mediaStatusSchema = z.enum([
  'READY',
  'ARCHIVED',
]);

const mediaResourceTypeSchema = z.enum([
  'IMAGE',
  'VIDEO',
  'RAW',
]);

const mediaListQuerySchema = z.object({
  status: mediaStatusSchema.optional(),

  scope: z
    .enum(MEDIA_SCOPES)
    .optional(),

  resourceType:
    mediaResourceTypeSchema.optional(),

  q: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform(
      (value) => value || undefined,
    ),

  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(200)
    .default(200),
});

function ensureCloudinary(
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  if (!isCloudinaryConfigured()) {
    return response.status(503).json({
      error:
        'MEDIA_PROVIDER_NOT_CONFIGURED',
      message:
        'Le service média n’est pas encore configuré.',
    });
  }

  return next();
}

function singleMediaUpload(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  upload.single('file')(
    request,
    response,
    (error) => {
      if (!error) {
        next();
        return;
      }

      if (
        error instanceof
          multer.MulterError &&
        error.code ===
          'LIMIT_FILE_SIZE'
      ) {
        response.status(413).json({
          error: 'MEDIA_TOO_LARGE',
          message:
            'Le fichier dépasse la taille maximale autorisée.',
        });

        return;
      }

      response.status(400).json({
        error:
          'INVALID_MEDIA_UPLOAD',
        message:
          error instanceof Error &&
          error.message ===
            'UNSUPPORTED_MEDIA_TYPE'
            ? 'Ce type de fichier n’est pas autorisé.'
            : 'Le fichier envoyé est invalide.',
      });
    },
  );
}

adminMediaRouter.get(
  '/',
  async (request, response) => {
    const parsed =
      mediaListQuerySchema.safeParse(
        request.query,
      );

    if (!parsed.success) {
      return response.status(400).json({
        error:
          'INVALID_MEDIA_FILTERS',
        message:
          'Les filtres de la bibliothèque média sont invalides.',
      });
    }

    const {
      status,
      scope,
      resourceType,
      q,
      page,
      limit,
    } = parsed.data;

    const folder = scope
      ? MEDIA_FOLDER_BY_SCOPE[scope]
      : undefined;

    const where = {
      ...(status
        ? { status }
        : {}),
      ...(folder
        ? { folder }
        : {}),
      ...(resourceType
        ? { resourceType }
        : {}),
      ...(q
        ? {
            OR: [
              {
                publicId: {
                  contains: q,
                },
              },
              {
                alt: {
                  contains: q,
                },
              },
              {
                caption: {
                  contains: q,
                },
              },
            ],
          }
        : {}),
    };

    try {
      const [
        media,
        total,
      ] = await prisma.$transaction([
        prisma.mediaAsset.findMany({
          where,
          orderBy: {
            createdAt: 'desc',
          },
          skip:
            (page - 1) *
            limit,
          take: limit,
        }),

        prisma.mediaAsset.count({
          where,
        }),
      ]);

      return response.json({
        data: media,
        meta: {
          page,
          limit,
          total,
          totalPages:
            Math.max(
              1,
              Math.ceil(
                total / limit,
              ),
            ),
        },
      });
    } catch (error) {
      console.error(
        'Erreur bibliothèque média :',
        error,
      );

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message:
          'Impossible de récupérer la bibliothèque média.',
      });
    }
  },
);

adminMediaRouter.post(
  '/upload',
  ensureCloudinary,
  singleMediaUpload,
  async (request, response) => {
    const parsed =
      uploadMetadataSchema.safeParse(
        request.body,
      );

    if (!parsed.success) {
      return response.status(400).json({
        error: 'VALIDATION_ERROR',
        message:
          'Les informations du média sont invalides.',
        details: parsed.error.issues,
      });
    }

    if (!request.file) {
      return response.status(400).json({
        error: 'MEDIA_FILE_REQUIRED',
        message:
          'Sélectionnez un fichier à envoyer.',
      });
    }

    const resourceType =
      getMediaResourceType(
        request.file.mimetype,
      );

    if (!resourceType) {
      return response.status(400).json({
        error:
          'UNSUPPORTED_MEDIA_TYPE',
        message:
          'Ce type de fichier n’est pas autorisé.',
      });
    }

    if (
      !isMediaSizeAllowed(
        resourceType,
        request.file.size,
      )
    ) {
      return response.status(413).json({
        error: 'MEDIA_TOO_LARGE',
        message:
          'Le fichier dépasse la taille autorisée pour ce type de média.',
      });
    }

    const folder =
      MEDIA_FOLDER_BY_SCOPE[
        parsed.data.scope
      ];

    try {
      const uploaded =
        await uploadMediaBuffer(
          request.file.buffer,
          {
            folder,
            resourceType:
              toCloudinaryResourceType(
                resourceType,
              ),
          },
        );

      const media =
        await prisma.mediaAsset.create({
          data: {
            publicId:
              uploaded.public_id,
            secureUrl:
              uploaded.secure_url,
            resourceType,
            width:
              typeof uploaded.width ===
              'number'
                ? uploaded.width
                : null,
            height:
              typeof uploaded.height ===
              'number'
                ? uploaded.height
                : null,
            format:
              uploaded.format ?? null,
            bytes:
              typeof uploaded.bytes ===
              'number'
                ? uploaded.bytes
                : request.file.size,
            alt: parsed.data.alt,
            caption:
              parsed.data.caption,
            folder,
            status: 'READY',
          },
        });

      return response.status(201).json({
        data: media,
      });
    } catch (error) {
      console.error(
        'Erreur upload média :',
        error,
      );

      return response.status(502).json({
        error:
          'MEDIA_UPLOAD_FAILED',
        message:
          'Impossible d’envoyer le média.',
      });
    }
  },
);

adminMediaRouter.patch(
  '/:id/archive',
  async (request, response) => {
    const id = Number(request.params.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return response.status(400).json({
        error: 'INVALID_MEDIA_ID',
        message:
          'Identifiant média invalide.',
      });
    }

    try {
      const result =
        await prisma.mediaAsset.updateMany({
          where: {
            id,
          },
          data: {
            status: 'ARCHIVED',
          },
        });

      if (result.count === 0) {
        return response.status(404).json({
          error: 'MEDIA_NOT_FOUND',
          message:
            'Ce média est introuvable.',
        });
      }

      return response.status(204).send();
    } catch (error) {
      console.error(
        'Erreur archivage média :',
        error,
      );

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message:
          'Impossible d’archiver ce média.',
      });
    }
  },
);

adminMediaRouter.patch(
  '/:id/restore',
  async (request, response) => {
    const id = Number(request.params.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return response.status(400).json({
        error: 'INVALID_MEDIA_ID',
        message:
          'Identifiant média invalide.',
      });
    }

    try {
      const result =
        await prisma.mediaAsset.updateMany({
          where: {
            id,
          },
          data: {
            status: 'READY',
          },
        });

      if (result.count === 0) {
        return response.status(404).json({
          error: 'MEDIA_NOT_FOUND',
          message:
            'Ce média est introuvable.',
        });
      }

      return response.status(204).send();
    } catch (error) {
      console.error(
        'Erreur restauration média :',
        error,
      );

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message:
          'Impossible de restaurer ce média.',
      });
    }
  },
);

adminMediaRouter.delete(
  '/:id',
  ensureCloudinary,
  async (request, response) => {
    const id = Number(request.params.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return response.status(400).json({
        error: 'INVALID_MEDIA_ID',
        message:
          'Identifiant média invalide.',
      });
    }

    try {
      const media =
        await prisma.mediaAsset.findUnique({
          where: {
            id,
          },
          include: {
            _count: {
              select: {
                serviceCovers: true,
                serviceGallery: true,
                realizationCovers: true,
                realizationVideos: true,
                realizationGallery: true,
                productMedia: true,
                homeSlides: true,
                companyLogos: true,
                companyFavicons: true,
                aboutHeroVideos: true,
                aboutHeroPosters: true,
                aboutIntroImages: true,
                aboutImplantationImages: true,
                aboutMissionImages: true,
                aboutValuesImages: true,
                aboutStrengthImages: true,
              },
            },
          },
        });

      if (!media) {
        return response.status(404).json({
          error: 'MEDIA_NOT_FOUND',
          message:
            'Ce média est introuvable.',
        });
      }

      const referenceCount =
        Object.values(
          media._count,
        ).reduce(
          (total, value) =>
            total + value,
          0,
        );

      if (referenceCount > 0) {
        return response.status(409).json({
          error: 'MEDIA_IN_USE',
          message:
            'Ce média est actuellement utilisé. Archivez-le ou retirez ses associations avant suppression.',
        });
      }

      const cloudinaryType =
        toCloudinaryResourceType(
          media.resourceType,
        );

      await destroyMediaAsset(
        media.publicId,
        cloudinaryType,
      );

      await prisma.mediaAsset.delete({
        where: {
          id,
        },
      });

      return response.status(204).send();
    } catch (error) {
      console.error(
        'Erreur suppression média :',
        error,
      );

      return response.status(502).json({
        error:
          'MEDIA_DELETE_FAILED',
        message:
          'Impossible de supprimer ce média.',
      });
    }
  },
);
