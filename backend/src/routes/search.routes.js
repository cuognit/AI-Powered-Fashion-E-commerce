import { Router } from 'express';
import { semanticSearchProducts } from '../controllers/search.controller.js';

const router = Router();

// GET /api/v1/search/semantic?q=...&page=1&limit=12
router.get('/semantic', semanticSearchProducts);

export default router;
