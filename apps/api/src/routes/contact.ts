import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { contactMessageRateLimit } from '../middleware/rate-limiters.js';

export const contactRouter = Router();

const contactMessageSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(2)
    .max(191),
  name: z
    .string()
    .trim()
    .min(2)
    .max(120),
  phone: z
    .string()
    .trim()
    .min(6)
    .max(32),
  email: z
    .union([
      z.string().trim().email().max(191),
      z.literal(''),
      z.null(),
    ])
    .optional()
    .transform((value) => value || null),
  message: z
    .string()
    .trim()
    .min(10)
    .max(5000),
});

contactRouter.post(
  '/messages',
  contactMessageRateLimit,
  async (request, response) => {
    const parsed =
      contactMessageSchema.safeParse(
        request.body,
      );

    if (!parsed.success) {
      return response.status(400).json({
        error: 'VALIDATION_ERROR',
        message:
          'Les informations du message sont invalides.',
        details: parsed.error.issues,
      });
    }

    try {
      const message =
        await prisma.contactMessage.create({
          data: parsed.data,
        });

      return response.status(201).json({
        data: {
          id: message.id,
          status: message.status,
          createdAt: message.createdAt,
        },
      });
    } catch (error) {
      console.error(
        'Erreur création message contact :',
        error,
      );

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message:
          'Impossible d’enregistrer votre message.',
      });
    }
  },
);
