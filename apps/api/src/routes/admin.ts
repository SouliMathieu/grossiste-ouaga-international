import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { adminLoginRateLimit } from '../middleware/rate-limiters.js';
import {
  ADMIN_CSRF_HEADER,
  ADMIN_SESSION_COOKIE,
  createAdminCsrfToken,
  hashAdminSessionToken,
  requireAdmin,
} from '../middleware/require-admin.js';

export const adminRouter = Router();

const ADMIN_SESSION_DURATION_MS = 12 * 60 * 60 * 1000;

const loginSchema = z.object({
  email: z.string().trim().email().max(191),
  password: z.string().min(8).max(128),
});

const paymentStatusSchema = z.enum([
  'PENDING',
  'SUBMITTED',
  'VERIFYING',
  'PAID',
  'REJECTED',
  'REFUNDED',
  'EXPIRED',
]);

const updatePaymentStatusSchema = z.object({
  status: z.enum(['VERIFYING', 'PAID', 'REJECTED']),
  adminNote: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((value) => value || undefined),
});

function getCookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/api/admin',
    maxAge: ADMIN_SESSION_DURATION_MS,
  };
}

adminRouter.post(
  '/auth/login',
  adminLoginRateLimit,
  async (request, response) => {
  const parsed = loginSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Email ou mot de passe invalide.',
    });
  }

  try {
    const email = parsed.data.email.toLowerCase();

    const admin = await prisma.adminUser.findUnique({
      where: {
        email,
      },
    });

    if (!admin || !admin.active) {
      return response.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Email ou mot de passe incorrect.',
      });
    }

    const passwordValid = await bcrypt.compare(
      parsed.data.password,
      admin.passwordHash,
    );

    if (!passwordValid) {
      return response.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Email ou mot de passe incorrect.',
      });
    }

    const sessionToken = randomBytes(32).toString('hex');
    const tokenHash = hashAdminSessionToken(sessionToken);
    const expiresAt = new Date(
      Date.now() + ADMIN_SESSION_DURATION_MS,
    );

    await prisma.adminSession.create({
      data: {
        adminUserId: admin.id,
        tokenHash,
        expiresAt,
      },
    });

    await prisma.adminUser.update({
      where: {
        id: admin.id,
      },
      data: {
        lastLoginAt: new Date(),
      },
    });

    response.cookie(
      ADMIN_SESSION_COOKIE,
      sessionToken,
      getCookieOptions(),
    );

    response.setHeader(
      ADMIN_CSRF_HEADER,
      createAdminCsrfToken(
        sessionToken,
      ),
    );

    return response.json({
      data: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Erreur connexion admin :', error);

    return response.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Impossible de connecter l’administrateur.',
    });
  }
});

adminRouter.get(
  '/auth/me',
  requireAdmin,
  (_request, response) => {
    return response.json({
      data: response.locals.admin,
    });
  },
);

adminRouter.post('/auth/logout', async (request, response) => {
  const token = request.cookies?.[ADMIN_SESSION_COOKIE];

  try {
    if (token && typeof token === 'string') {
      const tokenHash = hashAdminSessionToken(token);

      await prisma.adminSession.updateMany({
        where: {
          tokenHash,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    }
  } catch (error) {
    console.error('Erreur déconnexion admin :', error);
  }

  response.clearCookie(ADMIN_SESSION_COOKIE, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/admin',
  });

  return response.status(204).send();
});

adminRouter.get(
  '/payments',
  requireAdmin,
  async (request, response) => {
    const statusResult = paymentStatusSchema
      .optional()
      .safeParse(request.query.status);

    if (!statusResult.success) {
      return response.status(400).json({
        error: 'INVALID_STATUS',
        message: 'Le statut de paiement demandé est invalide.',
      });
    }

    try {
      const payments = await prisma.payment.findMany({
        ...(statusResult.data
          ? {
              where: {
                status: statusResult.data,
              },
            }
          : {}),
        include: {
          order: true,
          paymentMethod: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 100,
      });

      return response.json({
        data: payments.map((payment) => ({
          id: payment.id,
          status: payment.status,
          amount: Number(payment.amount),
          currency: payment.currency,
          payerPhone: payment.payerPhone,
          transactionId: payment.transactionId,
          submittedAt: payment.submittedAt,
          verifiedAt: payment.verifiedAt,
          adminNote: payment.adminNote,
          createdAt: payment.createdAt,
          method: {
            code: payment.paymentMethod.code,
            name: payment.paymentMethod.name,
            type: payment.paymentMethod.type,
          },
          order: {
            id: payment.order.id,
            reference: payment.order.reference,
            status: payment.order.status,
            customerName: payment.order.customerName,
            customerPhone: payment.order.customerPhone,
          },
        })),
      });
    } catch (error) {
      console.error('Erreur liste paiements admin :', error);

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Impossible de récupérer les paiements.',
      });
    }
  },
);

adminRouter.patch(
  '/payments/:id/status',
  requireAdmin,
  async (request, response) => {
    const paymentId = Number(request.params.id);

    if (!Number.isInteger(paymentId) || paymentId <= 0) {
      return response.status(400).json({
        error: 'INVALID_PAYMENT_ID',
        message: 'Identifiant de paiement invalide.',
      });
    }

    const parsed = updatePaymentStatusSchema.safeParse(
      request.body,
    );

    if (!parsed.success) {
      return response.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Le nouveau statut est invalide.',
      });
    }

    try {
      const payment = await prisma.payment.findUnique({
        where: {
          id: paymentId,
        },
        include: {
          order: true,
        },
      });

      if (!payment) {
        return response.status(404).json({
          error: 'PAYMENT_NOT_FOUND',
          message: 'Ce paiement est introuvable.',
        });
      }

      const transitions: Record<string, string[]> = {
        SUBMITTED: ['VERIFYING'],
        VERIFYING: ['PAID', 'REJECTED'],
      };

      const allowedTargets = transitions[payment.status] ?? [];

      if (!allowedTargets.includes(parsed.data.status)) {
        return response.status(409).json({
          error: 'INVALID_PAYMENT_TRANSITION',
          message: `Transition ${payment.status} → ${parsed.data.status} interdite.`,
        });
      }

      const updatedPayment = await prisma.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: parsed.data.status,
          adminNote: parsed.data.adminNote ?? payment.adminNote,
          verifiedAt:
            parsed.data.status === 'PAID' ||
            parsed.data.status === 'REJECTED'
              ? new Date()
              : payment.verifiedAt,
          ...(parsed.data.status === 'PAID'
            ? {
                order: {
                  update: {
                    status: 'CONFIRMED',
                  },
                },
              }
            : {}),
        },
        include: {
          order: true,
          paymentMethod: true,
        },
      });

      return response.json({
        data: {
          id: updatedPayment.id,
          status: updatedPayment.status,
          adminNote: updatedPayment.adminNote,
          verifiedAt: updatedPayment.verifiedAt,
          order: {
            reference: updatedPayment.order.reference,
            status: updatedPayment.order.status,
          },
        },
      });
    } catch (error) {
      console.error('Erreur changement statut paiement :', error);

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Impossible de modifier le statut du paiement.',
      });
    }
  },
);
