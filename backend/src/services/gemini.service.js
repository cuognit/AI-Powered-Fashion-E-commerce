import { GoogleGenAI } from '@google/genai'
import env from '../config/env.js'
import geminiKeyPool from './geminiKeyPool.js'

/**
 * Gọi Gemini generateContentStream qua pool 5 key và stream từng token về callback onChunk.
 * Đảm bảo:
 * - Có timeout cho từng attempt (GEMINI_REQUEST_TIMEOUT_MS) tự động abort request bị treo và xoay key.
 * - Khi stream đã phát token ra ngoài thì không retry sang key khác nếu gặp lỗi giữa chừng.
 * - Khi client abort thì dừng ngay lập tức, không thử key khác và báo lỗi AbortError.
 * @param {Object} params
 * @param {Array<{ role: string, content: string }>} params.messages - Lịch sử hội thoại
 * @param {string} params.systemInstruction - Chỉ dẫn hệ thống
 * @param {Function} params.onChunk - Callback nhận token dạng text: (text: string) => void
 * @param {AbortSignal} [params.signal] - Tín hiệu huỷ từ client
 * @param {Object} [params.options]
 * @returns {Promise<{ fullText: string, model: string }>}
 */
export async function streamGeminiChat({
  messages = [],
  systemInstruction = '',
  onChunk = () => {},
  signal = null,
  options = {},
}) {
  let model = options.model || env.gemini.model || 'gemini-2.5-flash'
  if (model.includes('3.5')) {
    model = 'gemini-2.5-flash'
  }
  const timeoutMs = options.timeoutMs || env.gemini.requestTimeoutMs || 30000

  // Format messages theo chuẩn của @google/genai
  const formattedContents = messages.map((m) => ({
    role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
    parts: [{ text: String(m.content || '') }],
  }))

  let hasEmittedTokensOverall = false
  let accumulatedText = ''

  return geminiKeyPool.executeWithRetry('generateContentStream', async (keyObj) => {
    // Kiểm tra nếu client đã abort trước khi bắt đầu key này
    if (signal?.aborted) {
      const abortErr = new Error('Yêu cầu đã bị hủy bởi người dùng')
      abortErr.name = 'AbortError'
      abortErr.isAborted = true
      abortErr.noRetry = true
      throw abortErr
    }

    const ai = new GoogleGenAI({ apiKey: keyObj.apiKey })

    const config = {}
    if (systemInstruction) {
      config.systemInstruction = systemInstruction
    }

    // Tắt thinking delay cho các dòng model hỗ trợ thinking để phản hồi tức thì
    if (typeof env.gemini.thinkingBudget === 'number' && (model.includes('3.7') || model.includes('2.5'))) {
      config.thinkingConfig = {
        thinkingBudget: env.gemini.thinkingBudget,
      }
    }

    let startedThisAttempt = false
    let isTimedOut = false
    let timeoutTimer = null

    // Quản lý timeout cho attempt hiện tại
    const attemptAbortController = new AbortController()

    const onClientAbort = () => {
      attemptAbortController.abort()
    }

    if (signal) {
      signal.addEventListener('abort', onClientAbort, { once: true })
    }

    timeoutTimer = setTimeout(() => {
      isTimedOut = true
      attemptAbortController.abort()
    }, timeoutMs)

    try {
      const responseStream = await ai.models.generateContentStream({
        model,
        contents: formattedContents,
        config,
      })

      for await (const chunk of responseStream) {
        if (attemptAbortController.signal.aborted || signal?.aborted || isTimedOut) {
          break
        }

        const text = chunk.text || ''
        if (text) {
          startedThisAttempt = true
          hasEmittedTokensOverall = true
          accumulatedText += text
          onChunk(text)
        }
      }

      // Kiểm tra nếu bị abort hoặc timeout sau vòng lặp
      if (isTimedOut) {
        const timeoutErr = new Error(`Yêu cầu Gemini vượt quá thời gian chờ (${timeoutMs}ms)`)
        timeoutErr.name = 'TimeoutError'
        timeoutErr.status = 408
        timeoutErr.statusCode = 408
        timeoutErr.code = 'ETIMEDOUT'
        if (startedThisAttempt || hasEmittedTokensOverall) {
          timeoutErr.noRetry = true
          timeoutErr.isPartial = true
          timeoutErr.partialText = accumulatedText
        }
        throw timeoutErr
      }

      if (signal?.aborted) {
        const abortErr = new Error('Yêu cầu đã bị hủy bởi người dùng')
        abortErr.name = 'AbortError'
        abortErr.isAborted = true
        abortErr.noRetry = true
        abortErr.isPartial = Boolean(accumulatedText)
        abortErr.partialText = accumulatedText
        throw abortErr
      }

      return {
        fullText: accumulatedText,
        model,
      }
    } catch (err) {
      if (isTimedOut || err.code === 'ETIMEDOUT' || err.name === 'TimeoutError') {
        const timeoutErr = new Error(`Yêu cầu Gemini vượt quá thời gian chờ (${timeoutMs}ms)`)
        timeoutErr.name = 'TimeoutError'
        timeoutErr.status = 408
        timeoutErr.statusCode = 408
        timeoutErr.code = 'ETIMEDOUT'
        if (startedThisAttempt || hasEmittedTokensOverall) {
          timeoutErr.noRetry = true
          timeoutErr.isPartial = true
          timeoutErr.partialText = accumulatedText
        }
        throw timeoutErr
      }

      // Nếu là lỗi abort từ người dùng
      if (signal?.aborted || err.name === 'AbortError' || err.isAborted) {
        err.name = 'AbortError'
        err.isAborted = true
        err.noRetry = true
        err.isPartial = Boolean(accumulatedText)
        err.partialText = accumulatedText
        throw err
      }

      // Nếu đã phát token ra client, chặn retry để không bị lặp/ghép sai phản hồi
      if (startedThisAttempt || hasEmittedTokensOverall) {
        err.noRetry = true
        err.isPartial = true
        err.partialText = accumulatedText
      }

      throw err
    } finally {
      if (timeoutTimer) {
        clearTimeout(timeoutTimer)
      }
      if (signal) {
        signal.removeEventListener('abort', onClientAbort)
      }
    }
  })
}

export default {
  streamGeminiChat,
}
