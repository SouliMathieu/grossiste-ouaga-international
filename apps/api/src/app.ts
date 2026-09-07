import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { corsOrigins } from './config/env.js';
import { adminRouter } from './routes/admin.js';
import { adminCatalogRouter } from './routes/admin-catalog.js';
import { adminOperationsRouter } from './routes/admin-operations.js';
import { catalogRouter } from './routes/catalog.js';
import { healthRouter } from './routes/health.js';
import { ordersRouter } from './routes/orders.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || corsOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(
          new Error('Origin not allowed by CORS'),
        );
      },
      credentials: true,
    }),
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.get('/api', (_request, response) => {
    response.json({
      name: 'GOI API',
      version: '0.1.0',
    });
  });

  app.use('/api/health', healthRouter);
  app.use('/api/catalog', catalogRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/admin/catalog', adminCatalogRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/admin', adminOperationsRouter);

  app.use((_request, response) => {
    response.status(404).json({
      error: 'NOT_FOUND',
      message: 'Ressource introuvable.',
    });
  });

  return app;
}
