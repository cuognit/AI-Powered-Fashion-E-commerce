import { Router } from 'express'
import { completeRefund, getOrders, updateStatus } from '../controllers/adminOrderController.js'
import { checkAdmin } from '../middlewares/checkAdmin.js'
import { orderReadRateLimit } from '../middlewares/rateLimit.js'
import validate from '../middlewares/validate.js'
import { verifyToken } from '../middlewares/verifyToken.js'
import { completeRefundSchema, updateOrderStatusSchema } from '../validations/orderValidation.js'

const router = Router()

router.use(verifyToken, checkAdmin)
router.get('/', orderReadRateLimit, getOrders)
router.patch('/:orderCode/status', validate(updateOrderStatusSchema), updateStatus)
router.patch('/:orderCode/refund', validate(completeRefundSchema), completeRefund)

export default router
