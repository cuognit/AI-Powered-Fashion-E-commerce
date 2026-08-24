import { Router } from 'express'
import vtonController from '../controllers/vton.controller.js'
import vtonUpload from '../middlewares/vtonUpload.js'
import optionalVerifyToken from '../middlewares/optionalVerifyToken.js'
import { verifyToken } from '../middlewares/verifyToken.js'

const router = Router()

// Lấy danh sách ảnh người mẫu mẫu có sẵn
router.get('/sample-models', vtonController.getSampleModels)

// Kiểm tra trạng thái tác vụ thử đồ ngầm
router.get('/tasks/:id', vtonController.getTaskStatus)

// Thử đồ trực tiếp (Synchronous - Chờ AI trả kết quả)
router.post(
  '/generate',
  optionalVerifyToken,
  vtonUpload,
  vtonController.generateTryOnSync
)

// Tạo tác vụ thử đồ ngầm (Asynchronous - Trả về task_id ngay)
router.post(
  '/submit',
  optionalVerifyToken,
  vtonUpload,
  vtonController.submitTryOnTask
)

// Lịch sử thử đồ (Yêu cầu đăng nhập)
router.get('/history', verifyToken, vtonController.getTryOnHistory)
router.delete('/history/:id', verifyToken, vtonController.deleteTryOnHistory)

export default router
