import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client.js';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL est manquant dans apps/api/.env');
}

const url = new URL(databaseUrl);

const databaseCaCert =
  process.env.AIVEN_CA_CERT?.replaceAll('\\n', '\n');

const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: Number(url.port || 3306),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: decodeURIComponent(url.pathname.replace(/^\//, '')),
  ssl: databaseCaCert
    ? { ca: [databaseCaCert] }
    : undefined,
  connectionLimit: 5,
  connectTimeout: 10000,
  allowPublicKeyRetrieval: true,
});

export const prisma = new PrismaClient({
  adapter,
  transactionOptions: {
    maxWait: 10000,
    timeout: 15000,
  },
});
