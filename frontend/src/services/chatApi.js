import axiosClient, { requestNewAccessToken } from './axiosClient.js'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

/**
 * Xử lý kết nối và đọc luồng Server-Sent Events (SSE) từ POST /api/chat/stream.
 */
export async function streamChatSSE({
  message,
  conversationId = null,
  clientMessageId = null,
  history = [],
  onReady = () => {},
  onSources = () => {},
  onToken = () => {},
  onDone = () => {},
  onError = () => {},
  signal = null,
  getAccessToken = () => null,
}) {
  let hasReceivedToken = false

  async function executeFetch(retryCount = 0) {
    const token = getAccessToken()
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const body = JSON.stringify({
      message,
      conversationId,
      clientMessageId,
      history,
    })

    const streamUrl = `${API_BASE_URL}/chat/stream`

    let response
    try {
      response = await fetch(streamUrl, {
        method: 'POST',
        headers,
        body,
        signal,
      })
    } catch (fetchErr) {
      if (fetchErr.name === 'AbortError') {
        return
      }
      throw fetchErr
    }

    // Xử lý khi token hết hạn (401) trước khi stream
    if (response.status === 401 && retryCount === 0 && !hasReceivedToken) {
      try {
        await requestNewAccessToken()
        return executeFetch(1)
      } catch (refreshErr) {
        // Fallback tiếp tục với quyền guest nếu refresh token thất bại
        return executeFetch(1)
      }
    }

    if (!response.ok && !response.headers.get('content-type')?.includes('text/event-stream')) {
      let errorData = {}
      try {
        errorData = await response.json()
      } catch {
        // Ignore
      }
      throw new Error(errorData.message || `Lỗi kết nối máy chủ (${response.status})`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n\n')
      buffer = lines.pop() || ''

      for (const block of lines) {
        if (!block.trim()) continue

        let eventType = 'message'
        let dataStr = ''

        const blockLines = block.split('\n')
        for (const line of blockLines) {
          if (line.startsWith('event:')) {
            eventType = line.replace(/^event:\s*/, '').trim()
          } else if (line.startsWith('data:')) {
            dataStr = line.replace(/^data:\s*/, '').trim()
          }
        }

        if (!dataStr) continue

        try {
          const parsed = JSON.parse(dataStr)

          switch (eventType) {
            case 'ready':
              onReady(parsed)
              break
            case 'sources':
              onSources(parsed)
              break
            case 'token':
              if (parsed.text) {
                hasReceivedToken = true
                onToken(parsed.text)
              }
              break
            case 'done':
              onDone(parsed)
              break
            case 'error':
              onError(parsed)
              break
            default:
              break
          }
        } catch (parseErr) {
          console.warn('[SSE Parse Error]:', parseErr, dataStr)
        }
      }
    }
  }

  try {
    await executeFetch(0)
  } catch (error) {
    if (error.name !== 'AbortError') {
      onError({
        code: 'CLIENT_NETWORK_ERROR',
        message: error.message || 'Không thể kết nối đến máy chủ AI, vui lòng thử lại.',
      })
    }
  }
}

/**
 * Lấy danh sách các cuộc hội thoại của User.
 */
export async function getConversations(page = 1, limit = 20) {
  const { data } = await axiosClient.get('/chat/conversations', {
    params: { page, limit },
  })
  return data
}

/**
 * Lấy lịch sử tin nhắn của 1 cuộc hội thoại.
 */
export async function getConversationMessages(conversationId) {
  const { data } = await axiosClient.get(`/chat/conversations/${conversationId}/messages`)
  return data
}

/**
 * Xóa một cuộc hội thoại.
 */
export async function deleteConversation(conversationId) {
  const { data } = await axiosClient.delete(`/chat/conversations/${conversationId}`)
  return data
}

export default {
  streamChatSSE,
  getConversations,
  getConversationMessages,
  deleteConversation,
}
