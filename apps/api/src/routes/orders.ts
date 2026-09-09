import { Router } from 'express';
import {
  orderCreateRateLimit,
  orderLookupRateLimit,
  paymentSubmitRateLimit,
} from '../middleware/rate-limiters.js';
import {
  createOrderController,
  getOrderByReferenceController,
  submitPaymentController,
} from '../controllers/orders.controller.js';

export const ordersRouter = Router();

ordersRouter.post(
  '/',
  orderCreateRateLimit,
  createOrderController,
);
ordersRouter.post(
  '/:reference/payment/submit',
  paymentSubmitRateLimit,
  submitPaymentController,
);
ordersRouter.get(
  '/:reference',
  orderLookupRateLimit,
  getOrderByReferenceController,
);
