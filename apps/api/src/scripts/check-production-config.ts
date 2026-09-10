import {
  corsOrigins,
  env,
} from '../config/env.js';

if (
  env.NODE_ENV !== 'production'
) {
  throw new Error(
    'Ce contrôle doit être exécuté avec NODE_ENV=production.',
  );
}

console.log(
  'Configuration production GOI valide.',
);

console.log({
  port: env.PORT,
  corsOrigins,
  databaseConfigured:
    Boolean(env.DATABASE_URL),

  cloudinaryConfigured:
    Boolean(
      env.CLOUDINARY_CLOUD_NAME &&
        env.CLOUDINARY_API_KEY &&
        env.CLOUDINARY_API_SECRET,
    ),

  metaCapiConfigured:
    Boolean(
      env.META_PIXEL_ID &&
        env
          .META_GRAPH_API_VERSION &&
        env
          .META_CONVERSIONS_ACCESS_TOKEN &&
        env
          .PUBLIC_STOREFRONT_URL,
    ),

  metaAdsConfigured:
    Boolean(
      env.META_APP_ID &&
        env.META_APP_SECRET &&
        env.META_AD_ACCOUNT_ID,
    ),

  googleAdsConfigured:
    Boolean(
      env
        .GOOGLE_ADS_CLIENT_ID &&
        env
          .GOOGLE_ADS_CLIENT_SECRET &&
        env
          .GOOGLE_ADS_DEVELOPER_TOKEN &&
        env
          .GOOGLE_ADS_CUSTOMER_ID,
    ),
});
