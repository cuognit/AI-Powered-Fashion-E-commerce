import mongoose from 'mongoose'
import Conversation from '../models/Conversation.js'
import ChatMessage from '../models/ChatMessage.js'
import { handleChatStream } from '../services/chat.service.js'
import { AppError } from '../utils/AppError.js'

/**
 * Helper định dạng và gửi SSE Event xuống Client
 */
function sendSseEvent(res, eventName, data) {
  res.write(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`)
}

/**
 * POST /api/chat/stream
 * Endpoint SSE stream phản hồi của Gemini RAG Chatbot theo thời gian thực.
 */
export async function streamChat(req, res) {
  // Thiết lập SSE Response Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })

  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders()
  }

  const abortController = new AbortController()
  req.on('close', () => {
    abortController.abort()
  })

  try {
    const { message, conversationId, clientMessageId, history } = req.body || {}
    const userId = req.user?.sub || null

    const result = await handleChatStream({
      message,
      conversationId,
      clientMessageId,
      userId,
      guestHistory: history,
      onReady: (readyData) => sendSseEvent(res, 'ready', readyData),
      onSources: (sourcesData) => sendSseEvent(res, 'sources', sourcesData),
      onToken: (text) => sendSseEvent(res, 'token', { text }),
      signal: abortController.signal,
    })

      sendSseEvent(res, 'done', {
        conversationId: result.conversationId,
        messageId: result.messageId,
        status: 'complete',
      })
    }
   catch (error) {
    if (abortController.signal.aborted || error.name === 'AbortError' || error.isAborted) {
      console.log('[ChatController] Stream đã bị hủy bởi người dùng.')
    } else {
      const statusCode = error.statusCode || (error.code === 'CHAT_PROVIDER_UNAVAILABLE' ? 503 : 500)
      console.error(`[ChatController Stream Error] code=${error.code || 'CHAT_STREAM_ERROR'} statusCode=${statusCode} msg=${error.message}`)
      sendSseEvent(res, 'error', {
        code: error.code || 'CHAT_STREAM_ERROR',
        message: error.message || 'Dịch vụ AI đang gặp sự cố, vui lòng thử lại sau.',
        statusCode,
        retryable: statusCode === 503 || error.code === 'CHAT_PROVIDER_UNAVAILABLE',
      })
    }
  } finally {
    res.end()
  }
}

/**
 * GET /api/chat/conversations
 * Lấy danh sách các cuộc hội thoại của User đăng nhập.
 */
export async function getConversations(req, res, next) {
  try {
    const userId = req.user.sub
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20))
    const skip = (page - 1) * limit

    const filter = { user_id: userId, is_archived: false }

    const [conversations, total] = await Promise.all([
      Conversation.find(filter)
        .sort({ last_message_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Conversation.countDocuments(filter),
    ])

    res.json({
      success: true,
      data: conversations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/chat/conversations/:conversationId/messages
 * Lấy lịch sử tin nhắn của một cuộc hội thoại (yêu cầu quyền sở hữu).
 */
export async function getConversationMessages(req, res, next) {
  try {
    const userId = req.user.sub
    const { conversationId } = req.params

    if (!mongoose.isValidObjectId(conversationId)) {
      throw new AppError('Mã cuộc trò chuyện không hợp lệ', 400)
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      user_id: userId,
      is_archived: false,
    }).lean()

    if (!conversation) {
      throw new AppError('Không tìm thấy cuộc trò chuyện', 404)
    }

    const messages = await ChatMessage.find({
      conversation_id: conversationId,
      user_id: userId,
    })
      .sort({ createdAt: 1 })
      .lean()

    res.json({
      success: true,
      data: {
        conversation,
        messages,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * DELETE /api/chat/conversations/:conversationId
 * Xoá / Lưu trữ một cuộc trò chuyện của User.
 */
export async function deleteConversation(req, res, next) {
  try {
    const userId = req.user.sub
    const { conversationId } = req.params

    if (!mongoose.isValidObjectId(conversationId)) {
      throw new AppError('Mã cuộc trò chuyện không hợp lệ', 400)
    }

    const conversation = await Conversation.findOneAndUpdate(
      { _id: conversationId, user_id: userId, is_archived: false },
      { is_archived: true },
      { new: true },
    )

    if (!conversation) {
      throw new AppError('Không tìm thấy cuộc trò chuyện', 404)
    }

    res.json({
      success: true,
      message: 'Đã xóa cuộc trò chuyện thành công',
    })
  } catch (error) {
    next(error)
  }
}

export default {
  streamChat,
  getConversations,
  getConversationMessages,
  deleteConversation,
}
