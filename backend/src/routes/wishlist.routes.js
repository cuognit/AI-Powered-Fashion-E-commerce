import { Router } from 'express'
import { addWishlistItem, getWishlist, removeWishlistItem } from '../controllers/wishlistController.js'
import { verifyToken } from '../middlewares/verifyToken.js'

const router = Router()
router.use(verifyToken)
router.get('/', getWishlist)
router.post('/items', addWishlistItem)
router.delete('/items/:productId', removeWishlistItem)
export default router
