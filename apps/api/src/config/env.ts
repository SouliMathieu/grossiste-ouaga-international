import 'dotenv/config';
import { z } from 'zod';

const optionalEnvString = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);

const envSchema = z.object({
  NODE_ENV: z
    .enum([
      'development',
      'test',
      'production',
    ])
    .default('development'),

  PORT: z.coerce
    .number()
    .int()
    .positive()
    .default(4000),

  CORS_ORIGINS: optionalEnvString,

  DATABASE_URL: optionalEnvString,
  SHADOW_DATABASE_URL:
    optionalEnvString,

  CLOUDINARY_CLOUD_NAME:
    optionalEnvString,
  CLOUDINARY_API_KEY:
    optionalEnvString,
  CLOUDINARY_API_SECRET:
    optionalEnvString,

  PUBLIC_STOREFRONT_URL:
    optionalEnvString,

  META_PIXEL_ID:
    optionalEnvString,
  META_GRAPH_API_VERSION:
    optionalEnvString,
  META_CONVERSIONS_ACCESS_TOKEN:
    optionalEnvString,
  META_TEST_EVENT_CODE:
    optionalEnvString,

  META_APP_ID:
    optionalEnvString,
  META_APP_SECRET:
    optionalEnvString,
  META_AD_ACCOUNT_ID:
    optionalEnvString,

  GOOGLE_ADS_CLIENT_ID:
    optionalEnvString,
  GOOGLE_ADS_CLIENT_SECRET:
    optionalEnvString,
  GOOGLE_ADS_DEVELOPER_TOKEN:
    optionalEnvString,
  GOOGLE_ADS_CUSTOMER_ID:
    optionalEnvString,

  ADS_MAX_DAILY_BUDGET_XOF:
    optionalEnvString,
  ADS_MAX_TOTAL_BUDGET_XOF:
    optionalEnvString,
});

const parsed =
  envSchema.parse(process.env);

const defaultCorsOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
];

function parseCorsOrigins(
  value: string | undefined,
) {
  if (!value) {
    if (
      parsed.NODE_ENV ===
      'production'
    ) {
      throw new Error(
        'CORS_ORIGINS doit être configuré explicitement en production.',
      );
    }

    return defaultCorsOrigins;
  }

  const origins = value
    .split(',')
    .map((origin) =>
      origin.trim(),
    )
    .filter(Boolean);

  if (!origins.length) {
    throw new Error(
      'CORS_ORIGINS ne contient aucune origine valide.',
    );
  }

  for (const origin of origins) {
    if (origin === '*') {
      throw new Error(
        'CORS_ORIGINS ne doit jamais utiliser *.',
      );
    }

    let url: URL;

    try {
      url = new URL(origin);
    } catch {
      throw new Error(
        `Origine CORS invalide : ${origin}`,
      );
    }

    if (
      url.protocol !== 'http:' &&
      url.protocol !== 'https:'
    ) {
      throw new Error(
        `Protocole CORS invalide : ${origin}`,
      );
    }

    const normalized =
      origin.replace(/\/+$/, '');

    if (url.origin !== normalized) {
      throw new Error(
        `CORS_ORIGINS doit contenir uniquement des origines sans chemin : ${origin}`,
      );
    }

    if (
      parsed.NODE_ENV ===
        'production' &&
      (
        url.hostname ===
          'localhost' ||
        url.hostname ===
          '127.0.0.1'
      )
    ) {
      throw new Error(
        `Origine locale interdite en production : ${origin}`,
      );
    }
  }

  return origins;
}

function validateProduction() {
  if (
    parsed.NODE_ENV !==
    'production'
  ) {
    return;
  }

  if (!parsed.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL est requis en production.',
    );
  }

  const cloudinary = [
    parsed.CLOUDINARY_CLOUD_NAME,
    parsed.CLOUDINARY_API_KEY,
    parsed.CLOUDINARY_API_SECRET,
  ];

  if (
    cloudinary.some(
      (value) => !value,
    )
  ) {
    throw new Error(
      'La configuration Cloudinary complète est requise en production.',
    );
  }
}

function validateMetaCapi() {
  const values = [
    parsed.META_PIXEL_ID,
    parsed.META_GRAPH_API_VERSION,
    parsed
      .META_CONVERSIONS_ACCESS_TOKEN,
    parsed.PUBLIC_STOREFRONT_URL,
  ];

  const configured =
    values.filter(Boolean).length;

  if (
    configured > 0 &&
    configured < values.length
  ) {
    throw new Error(
      'Meta Conversions API est partiellement configurée. META_PIXEL_ID, META_GRAPH_API_VERSION, META_CONVERSIONS_ACCESS_TOKEN et PUBLIC_STOREFRONT_URL doivent être fournis ensemble.',
    );
  }

  if (
    parsed.PUBLIC_STOREFRONT_URL
  ) {
    let url: URL;

    try {
      url = new URL(
        parsed
          .PUBLIC_STOREFRONT_URL,
      );
    } catch {
      throw new Error(
        'PUBLIC_STOREFRONT_URL est invalide.',
      );
    }

    if (
      parsed.NODE_ENV ===
        'production' &&
      url.protocol !== 'https:'
    ) {
      throw new Error(
        'PUBLIC_STOREFRONT_URL doit utiliser HTTPS en production.',
      );
    }
  }
}

export const corsOrigins =
  parseCorsOrigins(
    parsed.CORS_ORIGINS,
  );

validateProduction();
validateMetaCapi();

export const env = {
  ...parsed,
  CORS_ORIGINS:
    corsOrigins.join(','),
};
