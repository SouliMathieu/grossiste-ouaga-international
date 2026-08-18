import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { corsOrigins } from './config/env.js';
import { healthRouter } from './routes/health.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || corsOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('Origin not allowed by CORS'));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  app.get('/api', (_request, response) => {
    response.json({ name: 'GOI API', version: '0.1.0' });
  });
  app.use('/api/health', healthRouter);

  app.use((_request, response) => {
    response.status(404).json({ error: 'NOT_FOUND', message: 'Ressource introuvable.' });
  });

  return app;
}
