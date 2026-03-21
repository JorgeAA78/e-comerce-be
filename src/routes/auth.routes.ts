import { Router } from 'express';
import { requestAuthCode, verifyAuthCode } from '../controllers/auth.controller';

const router = Router();

router.post('/auth', requestAuthCode);
router.post('/auth/token', verifyAuthCode);

export default router;
