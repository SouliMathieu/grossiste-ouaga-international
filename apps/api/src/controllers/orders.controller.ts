import type { Request, Response } from 'express';
import { createOrderSchema, submitPaymentSchema } from '../schemas/orders.schema.js';
import {
  createOrder,
  getOrderByReference,
  submitPayment,
  DuplicateTransactionIdError,
  OrderNotFoundError,
  PaymentNotFoundError,
  PaymentNotSubmittableError,
  UnsupportedPaymentSubmissionError,
  UnknownPaymentMethodError,
  UnknownProductError,
} from '../services/orders.service.js';

export async function createOrderController(
  request: Request,
  response: Response,
) {
  const parsed = createOrderSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Les données de la commande sont invalides.',
      details: parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  try {
    const order = await createOrder(parsed.data);

    return response.status(201).json({
      data: {
        id: order.id,
        reference: order.reference,
        status: order.status,
        subtotal: Number(order.subtotal),
        currency: order.currency,
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
      },
    });
  } catch (error) {
    if (error instanceof UnknownProductError) {
      return response.status(400).json({
        error: 'UNKNOWN_PRODUCT',
        message: `Le produit ${error.productId} n'existe pas dans le catalogue.`,
      });
    }

    if (error instanceof UnknownPaymentMethodError) {
      return response.status(400).json({
        error: 'UNKNOWN_PAYMENT_METHOD',
        message: 'Ce moyen de paiement est indisponible.',
      });
    }

    console.error('Erreur création commande :', error);

    return response.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Impossible de créer la commande.',
    });
  }
}

export async function getOrderByReferenceController(
  request: Request<{ reference: string }>,
  response: Response,
) {
  const reference = request.params.reference?.trim();

  if (!reference) {
    return response.status(400).json({
      error: 'INVALID_REFERENCE',
      message: 'La référence de commande est invalide.',
    });
  }

  try {
    const order = await getOrderByReference(reference);

    if (!order) {
      return response.status(404).json({
        error: 'ORDER_NOT_FOUND',
        message: 'Cette commande est introuvable.',
      });
    }

    const payment = order.payments[0];

    return response.json({
      data: {
        reference: order.reference,
        status: order.status,
        subtotal: Number(order.subtotal),
        currency: order.currency,
        createdAt: order.createdAt,
        deliveryMode: order.deliveryMode,
        payment: payment
          ? {
              id: payment.id,
              status: payment.status,
              amount: Number(payment.amount),
              currency: payment.currency,
              method: {
                code: payment.paymentMethod.code,
                name: payment.paymentMethod.name,
                type: payment.paymentMethod.type,
                instructions: payment.paymentMethod.instructions,
                account: payment.paymentMethod.accounts[0]
                  ? {
                      accountName:
                        payment.paymentMethod.accounts[0].accountName,
                      accountNumber:
                        payment.paymentMethod.accounts[0].accountNumber,
                      merchantCode:
                        payment.paymentMethod.accounts[0].merchantCode,
                      actionUrl:
                        payment.paymentMethod.accounts[0].actionUrl,
                      ussdTemplate:
                        payment.paymentMethod.accounts[0].ussdTemplate,
                    }
                  : null,
              },
            }
          : null,
        items: order.items.map((item) => ({
          productId: item.productId,
          name: item.productName,
          sku: item.sku,
          unit: item.unit,
          unitPrice: Number(item.unitPrice),
          quantity: item.quantity,
          lineTotal: Number(item.lineTotal),
        })),
      },
    });
  } catch (error) {
    console.error('Erreur lecture commande :', error);

    return response.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Impossible de récupérer la commande.',
    });
  }
}

export async function submitPaymentController(
  request: Request<{ reference: string }>,
  response: Response,
) {
  const reference = request.params.reference?.trim();

  if (!reference) {
    return response.status(400).json({
      error: 'INVALID_REFERENCE',
      message: 'La référence de commande est invalide.',
    });
  }

  const parsed = submitPaymentSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Les informations de paiement sont invalides.',
      details: parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  try {
    const payment = await submitPayment(reference, parsed.data);

    return response.json({
      data: {
        id: payment.id,
        status: payment.status,
        payerPhone: payment.payerPhone,
        transactionId: payment.transactionId,
        submittedAt: payment.submittedAt,
      },
    });
  } catch (error) {
    if (error instanceof OrderNotFoundError) {
      return response.status(404).json({
        error: 'ORDER_NOT_FOUND',
        message: 'Cette commande est introuvable.',
      });
    }

    if (error instanceof PaymentNotFoundError) {
      return response.status(404).json({
        error: 'PAYMENT_NOT_FOUND',
        message: 'Aucun paiement n’est associé à cette commande.',
      });
    }

    if (error instanceof UnsupportedPaymentSubmissionError) {
      return response.status(400).json({
        error: 'UNSUPPORTED_PAYMENT_METHOD',
        message:
          'Ce moyen de paiement ne nécessite pas cette confirmation.',
      });
    }

    if (error instanceof PaymentNotSubmittableError) {
      return response.status(409).json({
        error: 'PAYMENT_NOT_SUBMITTABLE',
        message:
          'Ce paiement a déjà été soumis ou ne peut plus être modifié.',
      });
    }

    if (error instanceof DuplicateTransactionIdError) {
      return response.status(409).json({
        error: 'DUPLICATE_TRANSACTION_ID',
        message:
          'Cet identifiant de transaction a déjà été utilisé.',
      });
    }

    console.error('Erreur soumission paiement :', error);

    return response.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Impossible d’enregistrer la confirmation de paiement.',
    });
  }
}
