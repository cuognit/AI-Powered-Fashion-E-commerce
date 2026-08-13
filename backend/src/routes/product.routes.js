import { Router } from 'express';
import { getProductById } from '../controllers/product.controller.js';
import { getCatalogProducts, getProductFacets } from '../controllers/catalog.controller.js';

const router = Router();

router.get('/', getCatalogProducts);
router.get('/facets', getProductFacets);
router.get('/:id', getProductById);

export default router;
