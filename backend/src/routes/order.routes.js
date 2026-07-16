import { Router } from 'express'
import { getOrders } from '../controllers/orderController.js'
import { checkAdmin } from '../middlewares/checkAdmin.js'
import { verifyToken } from '../middlewares/verifyToken.js'

const router = Router()

router.get('/', verifyToken, checkAdmin, getOrders)

export default router
