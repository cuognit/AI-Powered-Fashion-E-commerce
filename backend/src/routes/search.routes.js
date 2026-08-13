import { Router } from 'express';
import { searchCatalog } from '../controllers/catalogSearch.controller.js';

const router = Router();

// GET /api/v1/search/semantic?q=...&page=1&limit=12
router.get('/semantic', searchCatalog);

export default router;
