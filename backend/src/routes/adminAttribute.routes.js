import { Router } from 'express'
import * as controller from '../controllers/adminAttributeController.js'
import { checkAdmin } from '../middlewares/checkAdmin.js'
import { verifyToken } from '../middlewares/verifyToken.js'
const router = Router(); router.use(verifyToken, checkAdmin)
router.get('/', controller.list); router.post('/', controller.create); router.patch('/:id', controller.update)
router.post('/:id/values', controller.addValue); router.patch('/:id/values/:valueId', controller.updateValue); router.delete('/:id/values/:valueId', controller.trashValue); router.patch('/:id/values/:valueId/restore', controller.restoreValue)
router.delete('/:id', controller.trash); router.patch('/:id/restore', controller.restore); router.delete('/:id/permanent', controller.purge)
export default router
