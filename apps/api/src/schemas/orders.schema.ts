import { z } from 'zod';

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);

export const paymentMethodCodeSchema = z.enum([
  'ORANGE_MONEY',
  'MOOV_MONEY',
  'WAVE',
  'CORIS_MONEY',
  'CASH_DELIVERY',
  'CASH_PICKUP',
  'BANK_TRANSFER',
]);

export const createOrderSchema = z
  .object({
    customerName: z.string().trim().min(2).max(120),

    customerPhone: z
      .string()
      .trim()
      .min(8)
      .max(32)
      .regex(/^[0-9+().\s-]+$/, 'Numéro de téléphone invalide.'),

    customerEmail: z
      .union([z.string().trim().email(), z.literal('')])
      .optional()
      .transform((value) => value || undefined),

    deliveryMode: z.enum(['DELIVERY', 'PICKUP']),

    deliveryAddress: optionalText,

    paymentMethodCode: paymentMethodCodeSchema,

    notes: z
      .string()
      .trim()
      .max(1000)
      .optional()
      .transform((value) => value || undefined),

    items: z
      .array(
        z.object({
          productId: z.number().int().positive(),
          quantity: z.number().int().min(1).max(999),
        }),
      )
      .min(1)
      .max(100),
  })
  .superRefine((data, context) => {
    if (data.deliveryMode === 'DELIVERY' && !data.deliveryAddress) {
      context.addIssue({
        code: 'custom',
        path: ['deliveryAddress'],
        message: 'Une adresse est obligatoire pour une livraison.',
      });
    }

    if (
      data.paymentMethodCode === 'CASH_DELIVERY' &&
      data.deliveryMode !== 'DELIVERY'
    ) {
      context.addIssue({
        code: 'custom',
        path: ['paymentMethodCode'],
        message:
          'Le paiement à la livraison nécessite le mode de livraison.',
      });
    }

    if (
      data.paymentMethodCode === 'CASH_PICKUP' &&
      data.deliveryMode !== 'PICKUP'
    ) {
      context.addIssue({
        code: 'custom',
        path: ['paymentMethodCode'],
        message:
          'Le paiement au retrait nécessite le mode retrait.',
      });
    }
  });

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const submitPaymentSchema = z.object({
  payerPhone: z
    .string()
    .trim()
    .min(8)
    .max(32)
    .regex(/^[0-9+().\s-]+$/, 'Numéro de téléphone invalide.'),

  transactionId: z
    .string()
    .trim()
    .min(3, 'L’identifiant de transaction est obligatoire.')
    .max(191),
});

export type SubmitPaymentInput = z.infer<typeof submitPaymentSchema>;
