import { Router } from 'express'
import { addItem, clearCart, getCart, removeItem, updateItem } from '../controllers/cartController.js'
import { verifyToken } from '../middlewares/verifyToken.js'

const router = Router()

router.use(verifyToken)
router.get('/', getCart)
router.post('/items', addItem)
router.patch('/items/:variantSku', updateItem)
router.delete('/items/:variantSku', removeItem)
router.delete('/', clearCart)

export default router
