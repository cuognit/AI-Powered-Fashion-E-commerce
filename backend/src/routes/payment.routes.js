import { Router } from 'express'
import { createPayment, ipn, paymentReturn } from '../controllers/paymentController.js'
import { ipnRateLimit, paymentRateLimit } from '../middlewares/rateLimit.js'
import validate from '../middlewares/validate.js'
import { verifyToken } from '../middlewares/verifyToken.js'
import { checkoutSchema } from '../validations/checkoutValidation.js'

const router = Router()
router.get('/vnpay/ipn', ipnRateLimit, ipn)
router.get('/vnpay/return', paymentReturn)
router.post('/vnpay', verifyToken, paymentRateLimit, validate(checkoutSchema), createPayment)
export default router
