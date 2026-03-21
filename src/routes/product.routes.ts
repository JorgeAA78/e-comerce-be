import { Router } from 'express';
import { searchProducts, getProductById } from '../controllers/product.controller';

const router = Router();

router.get('/search', searchProducts);
router.get('/products/:id', getProductById);

export default router;
