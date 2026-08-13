import { Router } from 'express'
import { getUser, getUserOrders, getUsers } from '../controllers/adminUserController.js'
import { checkAdmin } from '../middlewares/checkAdmin.js'
import { orderReadRateLimit } from '../middlewares/rateLimit.js'
import { verifyToken } from '../middlewares/verifyToken.js'

const router = Router()

router.use(verifyToken, checkAdmin, orderReadRateLimit)
router.get('/', getUsers)
router.get('/:userId/orders', getUserOrders)
router.get('/:userId', getUser)

export default router
