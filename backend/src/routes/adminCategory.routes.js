import { Router } from 'express'
import * as controller from '../controllers/adminCategoryController.js'
import { checkAdmin } from '../middlewares/checkAdmin.js'
import { verifyToken } from '../middlewares/verifyToken.js'

const router = Router()
router.use(verifyToken, checkAdmin)
router.get('/', controller.list)
router.post('/', controller.create)
router.patch('/:id', controller.update)
router.delete('/:id', controller.trash)
router.patch('/:id/restore', controller.restore)
router.delete('/:id/permanent', controller.purge)
export default router
