import { Router } from 'express'
import * as controller from '../controllers/adminProductController.js'
import { checkAdmin } from '../middlewares/checkAdmin.js'
import { verifyToken } from '../middlewares/verifyToken.js'

const router = Router()
router.use(verifyToken, checkAdmin)
router.get('/upload-signature', controller.getUploadSignature)
router.get('/', controller.list)
router.get('/:id', controller.get)
router.post('/', controller.create)
router.patch('/:id', controller.update)
router.patch('/:id/business', controller.business)
router.delete('/:id', controller.trash)
router.patch('/:id/restore', controller.restore)
router.delete('/:id/permanent', controller.purge)
export default router

