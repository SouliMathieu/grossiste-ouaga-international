import { randomUUID } from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import type {
  CreateOrderInput,
  SubmitPaymentInput,
} from '../schemas/orders.schema.js';

export class UnknownProductError extends Error {
  constructor(public readonly productId: number) {
    super(`Produit ${productId} introuvable.`);
    this.name = 'UnknownProductError';
  }
}

export class UnknownPaymentMethodError extends Error {
  constructor(public readonly code: string) {
    super(`Moyen de paiement ${code} indisponible.`);
    this.name = 'UnknownPaymentMethodError';
  }
}

export async function createOrder(input: CreateOrderInput) {
  const productIds = [
    ...new Set(input.items.map((item) => item.productId)),
  ];

  const products = await prisma.product.findMany({
    where: {
      id: {
        in: productIds,
      },
      status: 'PUBLISHED',
      category: {
        is: {
          active: true,
        },
      },
    },
  });

  const productsById = new Map(
    products.map((product) => [product.id, product]),
  );

  const serverItems = input.items.map((item) => {
    const product = productsById.get(item.productId);

    if (!product || product.price === null) {
      throw new UnknownProductError(item.productId);
    }

    const unitPrice = Number(product.price);

    return {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      unit: product.unit,
      unitPrice,
      quantity: item.quantity,
      lineTotal: unitPrice * item.quantity,
    };
  });

  const subtotal = serverItems.reduce(
    (total, item) => total + item.lineTotal,
    0,
  );

  const paymentMethod =
    await prisma.paymentMethod.findUnique({
      where: {
        code: input.paymentMethodCode,
      },
    });

  if (!paymentMethod || !paymentMethod.enabled) {
    throw new UnknownPaymentMethodError(
      input.paymentMethodCode,
    );
  }

  const temporaryReference =
    `TMP-${randomUUID().replaceAll('-', '').slice(0, 20)}`;

  const created = await prisma.order.create({
    data: {
      reference: temporaryReference,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail ?? null,
      deliveryMode: input.deliveryMode,
      deliveryAddress:
        input.deliveryMode === 'DELIVERY'
          ? input.deliveryAddress ?? null
          : null,
      subtotal,
      notes: input.notes ?? null,

      items: {
        create: serverItems,
      },

      payments: {
        create: {
          amount: subtotal,
          currency: 'XOF',
          status: 'PENDING',
          paymentMethod: {
            connect: {
              id: paymentMethod.id,
            },
          },
        },
      },
    },
    include: {
      items: true,
      payments: {
        include: {
          paymentMethod: {
            include: {
              accounts: {
                where: {
                  active: true,
                },
                orderBy: {
                  id: 'asc',
                },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  const year = new Date().getFullYear();

  const reference =
    `GOI-${year}-${String(created.id).padStart(6, '0')}`;

  try {
    return await prisma.order.update({
      where: {
        id: created.id,
      },
      data: {
        reference,
      },
      include: {
        items: true,
        payments: {
          include: {
            paymentMethod: {
              include: {
                accounts: {
                  where: {
                    active: true,
                  },
                  orderBy: {
                    id: 'asc',
                  },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });
  } catch (error) {
    try {
      await prisma.order.delete({
        where: {
          id: created.id,
        },
      });
    } catch (cleanupError) {
      console.error(
        'Impossible de nettoyer la commande temporaire :',
        cleanupError,
      );
    }

    throw error;
  }
}

export async function getOrderByReference(
  reference: string,
) {
  return prisma.order.findUnique({
    where: {
      reference,
    },
    include: {
      items: true,
      payments: {
        include: {
          paymentMethod: {
            include: {
              accounts: {
                where: {
                  active: true,
                },
                orderBy: {
                  id: 'asc',
                },
                take: 1,
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });
}

export class OrderNotFoundError extends Error {
  constructor(public readonly reference: string) {
    super(`Commande ${reference} introuvable.`);
    this.name = 'OrderNotFoundError';
  }
}

export class PaymentNotFoundError extends Error {
  constructor() {
    super('Aucun paiement associé à cette commande.');
    this.name = 'PaymentNotFoundError';
  }
}

export class PaymentNotSubmittableError extends Error {
  constructor(public readonly status: string) {
    super(
      `Le paiement ne peut pas être soumis depuis le statut ${status}.`,
    );
    this.name = 'PaymentNotSubmittableError';
  }
}

export class UnsupportedPaymentSubmissionError extends Error {
  constructor() {
    super(
      'Ce moyen de paiement ne permet pas cette soumission.',
    );
    this.name = 'UnsupportedPaymentSubmissionError';
  }
}

export class DuplicateTransactionIdError extends Error {
  constructor() {
    super(
      'Cet identifiant de transaction a déjà été utilisé.',
    );
    this.name = 'DuplicateTransactionIdError';
  }
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2002'
  );
}

export async function submitPayment(
  reference: string,
  input: SubmitPaymentInput,
) {
  const order = await prisma.order.findUnique({
    where: {
      reference,
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
    throw new OrderNotFoundError(reference);
  }

  const payment = order.payments[0];

  if (!payment) {
    throw new PaymentNotFoundError();
  }

  if (payment.paymentMethod.type !== 'MOBILE_MONEY') {
    throw new UnsupportedPaymentSubmissionError();
  }

  if (payment.status !== 'PENDING') {
    throw new PaymentNotSubmittableError(
      payment.status,
    );
  }

  const duplicateTransaction =
    await prisma.payment.findFirst({
      where: {
        paymentMethodId: payment.paymentMethodId,
        transactionId: input.transactionId,
        NOT: {
          id: payment.id,
        },
      },
    });

  if (duplicateTransaction) {
    throw new DuplicateTransactionIdError();
  }

  try {
    return await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        payerPhone: input.payerPhone,
        transactionId: input.transactionId,
        submittedAt: new Date(),
        status: 'SUBMITTED',
      },
      include: {
        paymentMethod: true,
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new DuplicateTransactionIdError();
    }

    throw error;
  }
}
