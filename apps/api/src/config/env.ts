import 'dotenv/config';
import { z } from 'zod';

const optionalEnvString = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:5174'),
  CLOUDINARY_CLOUD_NAME: optionalEnvString,
  CLOUDINARY_API_KEY: optionalEnvString,
  CLOUDINARY_API_SECRET: optionalEnvString,
});

export const env = envSchema.parse(process.env);
export const corsOrigins = env.CORS_ORIGINS.split(',').map((value) => value.trim());
