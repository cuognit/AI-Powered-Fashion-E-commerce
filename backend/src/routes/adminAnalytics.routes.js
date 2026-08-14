import { Router } from 'express'
import { getOverview } from '../controllers/adminAnalyticsController.js'
import { checkAdmin } from '../middlewares/checkAdmin.js'
import { verifyToken } from '../middlewares/verifyToken.js'

const router = Router()

router.use(verifyToken, checkAdmin)
router.get('/overview', getOverview)

export default router
