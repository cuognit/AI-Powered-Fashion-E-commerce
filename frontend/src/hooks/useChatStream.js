import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuthContext } from '../contexts/AuthContext.jsx'
import {
  deleteConversation,
  getConversationMessages,
  getConversations,
  streamChatSSE,
} from '../services/chatApi.js'

const GUEST_STORAGE_KEY = 'fashion_guest_chat_history'

function getInitialGuestHistory() {
  try {
    const raw = sessionStorage.getItem(GUEST_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function useChatStream() {
  const { accessToken, isAuthenticated } = useAuthContext()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [conversations, setConversations] = useState([])
  const [currentConversationId, setCurrentConversationId] = useState(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [error, setError] = useState(null)

  const abortControllerRef = useRef(null)
  const accessTokenRef = useRef(accessToken)
  accessTokenRef.current = accessToken

  // Load danh sách hội thoại khi User đã đăng nhập
  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const res = await getConversations(1, 30)
      if (res?.data) {
        setConversations(res.data)
      }
    } catch (err) {
      console.warn('[useChatStream] Không thể tải danh sách cuộc trò chuyện:', err)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations()
    } else {
      setConversations([])
      setMessages(getInitialGuestHistory())
      setCurrentConversationId(null)
    }
  }, [isAuthenticated, fetchConversations])

  // Lưu history của Guest vào sessionStorage
  useEffect(() => {
    if (!isAuthenticated) {
      try {
        sessionStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(messages.slice(-20)))
      } catch {
        // Ignore
      }
    }
  }, [messages, isAuthenticated])

  // Chọn và tải lịch sử của 1 cuộc hội thoại
  const selectConversation = useCallback(async (conversationId) => {
    if (!conversationId || conversationId === currentConversationId) return
    setIsLoadingHistory(true)
    setError(null)
    try {
      const res = await getConversationMessages(conversationId)
      if (res?.data?.messages) {
        const mapped = res.data.messages.map((m) => ({
          id: m._id,
          role: m.role,
          content: m.content,
          sources: m.sources || [],
          status: m.status,
          createdAt: m.createdAt,
        }))
        setMessages(mapped)
        setCurrentConversationId(conversationId)
      }
    } catch (err) {
      setError({
        message: err.response?.data?.message || 'Không thể tải lịch sử cuộc trò chuyện.',
      })
    } finally {
      setIsLoadingHistory(false)
    }
  }, [currentConversationId])

  // Bắt đầu cuộc trò chuyện mới
  const startNewConversation = useCallback(() => {
    if (isStreaming) {
      abortControllerRef.current?.abort()
    }
    setCurrentConversationId(null)
    setMessages([])
    setError(null)
    setIsStreaming(false)
  }, [isStreaming])

  // Xóa cuộc trò chuyện
  const removeConversation = useCallback(async (conversationId) => {
    try {
      await deleteConversation(conversationId)
      setConversations((prev) => prev.filter((c) => c._id !== conversationId))
      if (currentConversationId === conversationId) {
        startNewConversation()
      }
    } catch (err) {
      console.error('[useChatStream] Xóa cuộc trò chuyện thất bại:', err)
    }
  }, [currentConversationId, startNewConversation])

  // Dừng luồng stream
  const abortStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsStreaming(false)
    setMessages((prev) =>
      prev.map((msg) =>
        msg.isStreaming || msg.status === 'streaming'
          ? {
              ...msg,
              isStreaming: false,
              status: msg.content ? 'partial' : 'error',
              error: msg.content ? null : 'Đã dừng phản hồi.',
            }
          : msg,
      ),
    )
  }, [])

  // Gửi tin nhắn và nhận stream token
  const sendMessage = useCallback(async (rawText) => {
    const text = String(rawText || '').trim()
    if (!text || isStreaming) return

    setError(null)
    const clientMessageId = crypto.randomUUID()
    const userMsgId = `user-${Date.now()}`
    const assistantMsgId = `assistant-${Date.now()}`

    const userMessageObj = {
      id: userMsgId,
      role: 'user',
      content: text,
      status: 'complete',
      createdAt: new Date().toISOString(),
    }

    const initialAssistantObj = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      sources: [],
      status: 'streaming',
      isStreaming: true,
      createdAt: new Date().toISOString(),
    }

    // Lấy history hiện tại cho prompt
    const historyPayload = messages.slice(-12).map((m) => ({
      role: m.role,
      content: m.content,
    }))

    setMessages((prev) => [...prev, userMessageObj, initialAssistantObj])
    setIsStreaming(true)

    const controller = new AbortController()
    abortControllerRef.current = controller

    await streamChatSSE({
      message: text,
      conversationId: currentConversationId,
      clientMessageId,
      history: historyPayload,
      getAccessToken: () => accessTokenRef.current,
      signal: controller.signal,
      onReady: (readyData) => {
        if (readyData.conversationId && !currentConversationId) {
          setCurrentConversationId(readyData.conversationId)
          fetchConversations()
        }
      },
      onSources: (sourcesData) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, sources: sourcesData.items || [] }
              : msg,
          ),
        )
      },
      onToken: (tokenText) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, content: msg.content + tokenText }
              : msg,
          ),
        )
      },
      onDone: (doneData) => {
        setIsStreaming(false)
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, id: doneData.messageId || msg.id, status: 'complete', isStreaming: false }
              : msg,
          ),
        )
        fetchConversations()
      },
      onError: (errData) => {
        setIsStreaming(false)
        setError(errData)
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  status: msg.content ? 'partial' : 'error',
                  isStreaming: false,
                  error: errData.message,
                }
              : msg,
          ),
        )
      },
    })
  }, [isStreaming, messages, currentConversationId, fetchConversations])

  // Thử lại tin nhắn gần nhất nếu lỗi
  const retryLastMessage = useCallback(() => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')
    if (lastUserMsg) {
      sendMessage(lastUserMsg.content)
    }
  }, [messages, sendMessage])

  return {
    isOpen,
    setIsOpen,
    openChat: () => setIsOpen(true),
    closeChat: () => setIsOpen(false),
    toggleChat: () => setIsOpen((prev) => !prev),
    messages,
    conversations,
    currentConversationId,
    isStreaming,
    isLoadingHistory,
    error,
    sendMessage,
    abortStream,
    retryLastMessage,
    startNewConversation,
    selectConversation,
    removeConversation,
    fetchConversations,
  }
}

/**
 * Mở cửa sổ Chatbot Fashion AI từ bất kỳ component hoặc trang nào trên website.
 * @param {string} initialPrompt Tin nhắn mẫu (tùy chọn) để điền sẵn vào ô chat.
 */
export function openFashionChat(initialPrompt = '') {
  window.dispatchEvent(new CustomEvent('open-fashion-chat', { detail: { prompt: initialPrompt } }))
}

export default useChatStream
