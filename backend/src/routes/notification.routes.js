import { Router } from 'express'
import { verifyToken } from '../middlewares/verifyToken.js'
import * as notificationController from '../controllers/notificationController.js'

const router = Router()

// Tất cả các routes thông báo đều yêu cầu đăng nhập
router.use(verifyToken)

router.get('/', notificationController.getNotifications)
router.get('/unread-count', notificationController.getUnreadCount)
router.patch('/read-all', notificationController.markAllAsRead)
router.patch('/:id/read', notificationController.markAsRead)

export default router
