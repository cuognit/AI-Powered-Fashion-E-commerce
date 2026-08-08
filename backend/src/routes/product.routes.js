import { Router } from 'express';
import { 
  getProducts, 
  getProductById, 
  createProduct, 
  updateProduct,
  deleteProduct,
  seedProducts 
} from '../controllers/product.controller.js';

const router = Router();

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);
router.post('/seed', seedProducts);

export default router;
