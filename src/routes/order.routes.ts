import { Router } from 'express';
import { createOrder, getMyOrders, getOrderById } from '../controllers/order.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// POST /order?productId={id}
router.post('/order', authMiddleware as any, createOrder as any);

// GET /me/orders
router.get('/me/orders', authMiddleware as any, getMyOrders as any);

// GET /order/:orderId
router.get('/order/:orderId', authMiddleware as any, getOrderById as any);

export default router;
