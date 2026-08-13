import { Router } from 'express'
import authRoutes from './auth.routes.js'
import orderRoutes from './order.routes.js'
import productRoutes from './product.routes.js'
import reviewRoutes from './review.routes.js'
import searchRoutes from './search.routes.js'
import cartRoutes from './cart.routes.js'
import paymentRoutes from './payment.routes.js'
import adminOrderRoutes from './adminOrder.routes.js'
import wishlistRoutes from './wishlist.routes.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/products', productRoutes)
router.use('/orders', orderRoutes)
router.use('/reviews', reviewRoutes)
router.use('/search', searchRoutes)
router.use('/cart', cartRoutes)
router.use('/payments', paymentRoutes)
router.use('/admin/orders', adminOrderRoutes)
router.use('/wishlist', wishlistRoutes)

export default router
