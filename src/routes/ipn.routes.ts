import { Router } from 'express';
import { mercadoPagoIPN } from '../controllers/ipn.controller';

const router = Router();

// MercadoPago envía POST a esta URL cuando se confirma un pago
router.post('/ipn/mercadopago', mercadoPagoIPN);

export default router;
