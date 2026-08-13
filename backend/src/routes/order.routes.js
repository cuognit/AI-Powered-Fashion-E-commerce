import { Router } from 'express'
import { cancelOrder, confirmReceived, createCodOrder, getOrder, getOrders, reorder } from '../controllers/orderController.js'
import { verifyToken } from '../middlewares/verifyToken.js'
import { orderMutationRateLimit, orderReadRateLimit, paymentRateLimit } from '../middlewares/rateLimit.js'
import validate from '../middlewares/validate.js'
import { checkoutSchema } from '../validations/checkoutValidation.js'
import { cancelOrderSchema } from '../validations/orderValidation.js'

const router = Router()

router.get('/', verifyToken, orderReadRateLimit, getOrders)
router.post('/cod', verifyToken, paymentRateLimit, validate(checkoutSchema.omit({ bankCode: true })), createCodOrder)
router.post('/:orderCode/cancel', verifyToken, orderMutationRateLimit, validate(cancelOrderSchema), cancelOrder)
router.post('/:orderCode/reorder', verifyToken, orderMutationRateLimit, reorder)
router.patch('/:orderCode/received', verifyToken, orderMutationRateLimit, confirmReceived)
router.get('/:orderCode', verifyToken, orderReadRateLimit, getOrder)

export default router
