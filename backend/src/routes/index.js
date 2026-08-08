import { Router } from 'express'
import authRoutes from './auth.routes.js'
import orderRoutes from './order.routes.js'
import productRoutes from './product.routes.js'
import reviewRoutes from './review.routes.js'
import searchRoutes from './search.routes.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/products', productRoutes)
router.use('/orders', orderRoutes)
router.use('/reviews', reviewRoutes)
router.use('/search', searchRoutes)

export default router
