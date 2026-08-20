import { Router } from 'express'
import {
  streamChat,
  getConversations,
  getConversationMessages,
  deleteConversation,
} from '../controllers/chat.controller.js'
import { verifyToken } from '../middlewares/verifyToken.js'
import { optionalVerifyToken } from '../middlewares/optionalVerifyToken.js'
import { chatRateLimit } from '../middlewares/rateLimit.js'

const router = Router()

// SSE Streaming chat: Dành cho cả Guest và Authenticated User
router.post('/stream', optionalVerifyToken, chatRateLimit, streamChat)

// Các API quản lý hội thoại: Yêu cầu đăng nhập
router.get('/conversations', verifyToken, getConversations)
router.get('/conversations/:conversationId/messages', verifyToken, getConversationMessages)
router.delete('/conversations/:conversationId', verifyToken, deleteConversation)

export default router
