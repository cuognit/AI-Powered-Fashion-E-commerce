import { Router } from 'express'
import authRoutes from './auth.routes.js'
import orderRoutes from './order.routes.js'
import productRoutes from './product.routes.js'
import reviewRoutes from './review.routes.js'
import searchRoutes from './search.routes.js'
import cartRoutes from './cart.routes.js'
import paymentRoutes from './payment.routes.js'
import adminOrderRoutes from './adminOrder.routes.js'
import adminUserRoutes from './adminUser.routes.js'
import adminProductRoutes from './adminProduct.routes.js'
import adminCategoryRoutes from './adminCategory.routes.js'
import adminBrandRoutes from './adminBrand.routes.js'
import adminAttributeRoutes from './adminAttribute.routes.js'
import adminAnalyticsRoutes from './adminAnalytics.routes.js'
import wishlistRoutes from './wishlist.routes.js'
import notificationRoutes from './notification.routes.js'
import chatRoutes from './chat.routes.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/products', productRoutes)
router.use('/orders', orderRoutes)
router.use('/reviews', reviewRoutes)
router.use('/search', searchRoutes)
router.use('/cart', cartRoutes)
router.use('/payments', paymentRoutes)
router.use('/notifications', notificationRoutes)
router.use('/chat', chatRoutes)
router.use('/admin/analytics', adminAnalyticsRoutes)
router.use('/admin/orders', adminOrderRoutes)
router.use('/admin/users', adminUserRoutes)
router.use('/admin/products', adminProductRoutes)
router.use('/admin/categories', adminCategoryRoutes)
router.use('/admin/brands', adminBrandRoutes)
router.use('/admin/attributes', adminAttributeRoutes)
router.use('/wishlist', wishlistRoutes)

export default router
