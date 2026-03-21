import { Router } from 'express';
import { getMe, updateMe, updateMyAddress } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Auth middleware aplicado individualmente a cada ruta protegida
router.get('/me', authMiddleware as any, getMe as any);
router.patch('/me', authMiddleware as any, updateMe as any);
router.patch('/me/address', authMiddleware as any, updateMyAddress as any);

export default router;

