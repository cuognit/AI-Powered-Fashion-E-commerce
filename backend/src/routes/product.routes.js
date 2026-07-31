import { Router } from 'express';
import { 
  getProducts, 
  getProductById, 
  createProduct, 
  seedProducts 
} from '../controllers/product.controller.js';

const router = Router();

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', createProduct);
router.post('/seed', seedProducts);

export default router;
