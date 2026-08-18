import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (_request, response) => {
  response.json({
    ok: true,
    service: 'goi-api',
    phase: 'foundation',
    timestamp: new Date().toISOString(),
  });
});
