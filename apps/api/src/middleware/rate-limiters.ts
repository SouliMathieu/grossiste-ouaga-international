import { rateLimit } from 'express-rate-limit';

export const RATE_LIMIT_POLICIES = {
  adminLogin: {
    windowMs: 15 * 60 * 1000,
    limit: 10,
  },
  orderCreate: {
    windowMs: 15 * 60 * 1000,
    limit: 20,
  },
  orderLookup: {
    windowMs: 5 * 60 * 1000,
    limit: 60,
  },
  paymentSubmit: {
    windowMs: 15 * 60 * 1000,
    limit: 20,
  },
  contact: {
    windowMs: 30 * 60 * 1000,
    limit: 10,
  },
} as const;

function createLimiter(
  policy: {
    windowMs: number;
    limit: number;
  },
  message: string,
  options?: {
    skipSuccessfulRequests?: boolean;
  },
) {
  return rateLimit({
    windowMs: policy.windowMs,
    limit: policy.limit,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests:
      options?.skipSuccessfulRequests ??
      false,
    handler: (_request, response) => {
      return response.status(429).json({
        error: 'RATE_LIMITED',
        message,
      });
    },
  });
}

export const adminLoginRateLimit =
  createLimiter(
    RATE_LIMIT_POLICIES.adminLogin,
    'Trop de tentatives de connexion. Veuillez réessayer plus tard.',
    {
      skipSuccessfulRequests: true,
    },
  );

export const orderCreateRateLimit =
  createLimiter(
    RATE_LIMIT_POLICIES.orderCreate,
    'Trop de commandes ont été envoyées. Veuillez réessayer plus tard.',
  );

export const orderLookupRateLimit =
  createLimiter(
    RATE_LIMIT_POLICIES.orderLookup,
    'Trop de consultations de commandes. Veuillez réessayer plus tard.',
  );

export const paymentSubmitRateLimit =
  createLimiter(
    RATE_LIMIT_POLICIES.paymentSubmit,
    'Trop de confirmations de paiement. Veuillez réessayer plus tard.',
  );

export const contactMessageRateLimit =
  createLimiter(
    RATE_LIMIT_POLICIES.contact,
    'Trop de messages ont été envoyés. Veuillez réessayer plus tard.',
  );
