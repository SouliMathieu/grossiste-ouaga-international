import { Router } from 'express';
import {
  createOrderController,
  getOrderByReferenceController,
  submitPaymentController,
} from '../controllers/orders.controller.js';

export const ordersRouter = Router();

ordersRouter.post('/', createOrderController);
ordersRouter.post('/:reference/payment/submit', submitPaymentController);
ordersRouter.get('/:reference', getOrderByReferenceController);
