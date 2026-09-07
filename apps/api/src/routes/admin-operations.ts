import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAdmin } from '../middleware/require-admin.js';

export const adminOperationsRouter = Router();

adminOperationsRouter.use(requireAdmin);

const orderStatusSchema = z.enum([
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'READY',
  'COMPLETED',
  'CANCELLED',
]);

const updateOrderStatusSchema = z.object({
  status: z.enum([
    'CONFIRMED',
    'PROCESSING',
    'READY',
    'COMPLETED',
    'CANCELLED',
  ]),
});

const nullableText = (max: number) =>
  z
    .union([
      z.string().trim().max(max),
      z.literal(''),
      z.null(),
    ])
    .optional()
    .transform((value) => value || null);

const paymentAccountSchema = z.object({
  accountName: nullableText(120),
  accountNumber: nullableText(100),
  merchantCode: nullableText(100),
  actionUrl: z
    .union([
      z.string().trim().url(),
      z.literal(''),
      z.null(),
    ])
    .optional()
    .transform((value) => value || null),
  ussdTemplate: nullableText(255),
  instructions: nullableText(2000),
  active: z.boolean().default(true),
});

adminOperationsRouter.get(
  '/orders',
  async (request, response) => {
    const statusResult = orderStatusSchema
      .optional()
      .safeParse(request.query.status);

    if (!statusResult.success) {
      return response.status(400).json({
        error: 'INVALID_ORDER_STATUS',
        message: 'Le statut de commande est invalide.',
      });
    }

    try {
      const orders = await prisma.order.findMany({
        ...(statusResult.data
          ? {
              where: {
                status: statusResult.data,
              },
            }
          : {}),
        include: {
          items: true,
          payments: {
            include: {
              paymentMethod: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 100,
      });

      return response.json({
        data: orders.map((order) => {
          const payment = order.payments[0];

          return {
            id: order.id,
            reference: order.reference,
            status: order.status,
            subtotal: Number(order.subtotal),
            currency: order.currency,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            customerEmail: order.customerEmail,
            deliveryMode: order.deliveryMode,
            deliveryAddress: order.deliveryAddress,
            notes: order.notes,
            createdAt: order.createdAt,
            items: order.items.map((item) => ({
              id: item.id,
              productId: item.productId,
              name: item.productName,
              sku: item.sku,
              unit: item.unit,
              unitPrice: Number(item.unitPrice),
              quantity: item.quantity,
              lineTotal: Number(item.lineTotal),
            })),
            payment: payment
              ? {
                  id: payment.id,
                  status: payment.status,
                  amount: Number(payment.amount),
                  payerPhone: payment.payerPhone,
                  transactionId: payment.transactionId,
                  method: {
                    code: payment.paymentMethod.code,
                    name: payment.paymentMethod.name,
                    type: payment.paymentMethod.type,
                  },
                }
              : null,
          };
        }),
      });
    } catch (error) {
      console.error(
        'Erreur liste commandes admin :',
        error,
      );

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message:
          'Impossible de récupérer les commandes.',
      });
    }
  },
);

adminOperationsRouter.patch(
  '/orders/:id/status',
  async (request, response) => {
    const orderId = Number(request.params.id);

    if (
      !Number.isInteger(orderId) ||
      orderId <= 0
    ) {
      return response.status(400).json({
        error: 'INVALID_ORDER_ID',
        message: 'Identifiant de commande invalide.',
      });
    }

    const parsed = updateOrderStatusSchema.safeParse(
      request.body,
    );

    if (!parsed.success) {
      return response.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Le nouveau statut est invalide.',
      });
    }

    try {
      const order = await prisma.order.findUnique({
        where: {
          id: orderId,
        },
        include: {
          payments: {
            include: {
              paymentMethod: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
      });

      if (!order) {
        return response.status(404).json({
          error: 'ORDER_NOT_FOUND',
          message: 'Cette commande est introuvable.',
        });
      }

      const transitions: Record<string, string[]> = {
        PENDING: ['CONFIRMED', 'CANCELLED'],
        CONFIRMED: ['PROCESSING', 'CANCELLED'],
        PROCESSING: ['READY', 'CANCELLED'],
        READY: ['COMPLETED'],
      };

      const allowedTargets =
        transitions[order.status] ?? [];

      if (!allowedTargets.includes(parsed.data.status)) {
        return response.status(409).json({
          error: 'INVALID_ORDER_TRANSITION',
          message: `Transition ${order.status} → ${parsed.data.status} interdite.`,
        });
      }

      if (
        order.status === 'PENDING' &&
        parsed.data.status === 'CONFIRMED'
      ) {
        const payment = order.payments[0];

        if (!payment) {
          return response.status(409).json({
            error: 'PAYMENT_REQUIRED',
            message:
              'Aucun paiement n’est associé à cette commande.',
          });
        }

        if (
          payment.paymentMethod.type !== 'CASH' &&
          payment.status !== 'PAID'
        ) {
          return response.status(409).json({
            error: 'PAYMENT_NOT_PAID',
            message:
              'Cette commande ne peut pas être confirmée tant que son paiement n’est pas validé.',
          });
        }
      }

      const updated = await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          status: parsed.data.status,
        },
      });

      return response.json({
        data: {
          id: updated.id,
          reference: updated.reference,
          status: updated.status,
        },
      });
    } catch (error) {
      console.error(
        'Erreur changement statut commande :',
        error,
      );

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message:
          'Impossible de modifier la commande.',
      });
    }
  },
);

adminOperationsRouter.get(
  '/payment-accounts',
  async (_request, response) => {
    try {
      const methods =
        await prisma.paymentMethod.findMany({
          where: {
            enabled: true,
          },
          include: {
            accounts: {
              orderBy: {
                id: 'asc',
              },
            },
          },
          orderBy: {
            sortOrder: 'asc',
          },
        });

      return response.json({
        data: methods.map((method) => {
          const account =
            method.accounts.find(
              (item) => item.active,
            ) ??
            method.accounts[0] ??
            null;

          return {
            id: method.id,
            code: method.code,
            name: method.name,
            type: method.type,
            instructions: method.instructions,
            account: account
              ? {
                  id: account.id,
                  accountName: account.accountName,
                  accountNumber:
                    account.accountNumber,
                  merchantCode:
                    account.merchantCode,
                  actionUrl: account.actionUrl,
                  ussdTemplate:
                    account.ussdTemplate,
                  active: account.active,
                }
              : null,
          };
        }),
      });
    } catch (error) {
      console.error(
        'Erreur comptes paiement admin :',
        error,
      );

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message:
          'Impossible de récupérer les comptes de paiement.',
      });
    }
  },
);

adminOperationsRouter.put(
  '/payment-accounts/:code',
  async (request, response) => {
    const code = request.params.code?.trim();

    if (!code) {
      return response.status(400).json({
        error: 'INVALID_PAYMENT_METHOD',
        message: 'Moyen de paiement invalide.',
      });
    }

    const parsed = paymentAccountSchema.safeParse(
      request.body,
    );

    if (!parsed.success) {
      return response.status(400).json({
        error: 'VALIDATION_ERROR',
        message:
          'Les informations du compte sont invalides.',
        details: parsed.error.issues,
      });
    }

    try {
      const method =
        await prisma.paymentMethod.findUnique({
          where: {
            code,
          },
        });

      if (!method || !method.enabled) {
        return response.status(404).json({
          error: 'PAYMENT_METHOD_NOT_FOUND',
          message:
            'Ce moyen de paiement est introuvable.',
        });
      }

      if (method.type === 'CASH') {
        return response.status(400).json({
          error: 'PAYMENT_ACCOUNT_NOT_REQUIRED',
          message:
            'Un paiement en espèces ne nécessite pas de compte marchand.',
        });
      }

      if (
        method.type === 'MOBILE_MONEY' &&
        !parsed.data.accountNumber &&
        !parsed.data.merchantCode
      ) {
        return response.status(400).json({
          error: 'PAYMENT_ACCOUNT_REQUIRED',
          message:
            'Renseignez un numéro ou un code marchand.',
        });
      }

      await prisma.paymentMethod.update({
        where: {
          id: method.id,
        },
        data: {
          instructions:
            parsed.data.instructions,
        },
      });

      const existing =
        await prisma.paymentAccount.findFirst({
          where: {
            paymentMethodId: method.id,
          },
          orderBy: {
            id: 'asc',
          },
        });

      await prisma.paymentAccount.updateMany({
        where: {
          paymentMethodId: method.id,
        },
        data: {
          active: false,
        },
      });

      const account = existing
        ? await prisma.paymentAccount.update({
            where: {
              id: existing.id,
            },
            data: {
              accountName:
                parsed.data.accountName,
              accountNumber:
                parsed.data.accountNumber,
              merchantCode:
                parsed.data.merchantCode,
              actionUrl:
                parsed.data.actionUrl,
              ussdTemplate:
                parsed.data.ussdTemplate,
              active: parsed.data.active,
            },
          })
        : await prisma.paymentAccount.create({
            data: {
              paymentMethodId: method.id,
              accountName:
                parsed.data.accountName,
              accountNumber:
                parsed.data.accountNumber,
              merchantCode:
                parsed.data.merchantCode,
              actionUrl:
                parsed.data.actionUrl,
              ussdTemplate:
                parsed.data.ussdTemplate,
              active: parsed.data.active,
            },
          });

      return response.json({
        data: {
          code: method.code,
          name: method.name,
          instructions:
            parsed.data.instructions,
          account: {
            id: account.id,
            accountName: account.accountName,
            accountNumber: account.accountNumber,
            merchantCode: account.merchantCode,
            actionUrl: account.actionUrl,
            ussdTemplate: account.ussdTemplate,
            active: account.active,
          },
        },
      });
    } catch (error) {
      console.error(
        'Erreur modification compte paiement :',
        error,
      );

      return response.status(500).json({
        error: 'INTERNAL_ERROR',
        message:
          'Impossible de modifier le compte de paiement.',
      });
    }
  },
);
