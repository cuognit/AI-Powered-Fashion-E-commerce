import env from '../config/env.js'

export class GeminiKeyPool {
  constructor(options = {}) {
    const rawKeys = options.keys || env.gemini.keys || []
    this.maxInFlightPerKey = options.maxInFlightPerKey || env.gemini.maxInFlightPerKey || 2
    this.maxAttempts = options.maxAttempts || env.gemini.maxAttempts || 5
    this.keyCooldownMs = options.keyCooldownMs || env.gemini.keyCooldownMs || 30000
    this.invalidKeyCooldownMs = options.invalidKeyCooldownMs || env.gemini.invalidKeyCooldownMs || 600000
    this.maxKeyWaitMs = options.maxKeyWaitMs || env.gemini.maxKeyWaitMs || 1000

    this.loadKeys(rawKeys)
    this.cursor = 0
  }

  loadKeys(rawKeys) {
    const keys = rawKeys || env.gemini.keys || [
      process.env.GEMINI_API_KEY_1,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3,
      process.env.GEMINI_API_KEY_4,
      process.env.GEMINI_API_KEY_5,
    ].filter((k) => typeof k === 'string' && k.trim().length > 0)

    this.keys = keys.map((apiKey, idx) => ({
      index: idx + 1,
      apiKey: String(apiKey).trim(),
      inFlight: 0,
      cooldownUntil: 0,
      disabled: false,
      consecutiveFailures: 0,
      lastErrorCode: null,
    }))
  }

  ensureKeysLoaded() {
    if (!this.keys || this.keys.length === 0) {
      this.loadKeys()
    }
  }

  hasAvailableKeys() {
    this.ensureKeysLoaded()
    const now = Date.now()
    return this.keys.some((k) => !k.disabled && k.cooldownUntil <= now)
  }

  getAvailableKey(attemptedIndices = new Set()) {
    this.ensureKeysLoaded()
    if (!this.keys.length) return null
    const now = Date.now()
    const total = this.keys.length

    for (let i = 0; i < total; i += 1) {
      const idx = (this.cursor + i) % total
      const keyObj = this.keys[idx]

      if (attemptedIndices.has(keyObj.index)) continue
      if (keyObj.disabled) continue
      if (keyObj.cooldownUntil > now) continue
      if (keyObj.inFlight >= this.maxInFlightPerKey) continue

      this.cursor = (idx + 1) % total
      return keyObj
    }

    return null
  }

  async acquireKeyWithWait(attemptedIndices = new Set(), timeoutMs = this.maxKeyWaitMs) {
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
      const keyObj = this.getAvailableKey(attemptedIndices)
      if (keyObj) return keyObj
      // Wait 50ms before checking again
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
    return this.getAvailableKey(attemptedIndices)
  }

  classifyError(error) {
    // Abort error: do not retry other keys
    if (error?.name === 'AbortError' || error?.isAborted || error?.code === 'ERR_ABORTED' || String(error?.message || '').toLowerCase().includes('aborted')) {
      return { type: 'ABORT_ERROR', status: 499, retryable: false }
    }

    // Explicit non-retryable flag (e.g. streaming already started yielding tokens)
    if (error?.noRetry === true) {
      return { type: error.type || 'STREAM_INTERRUPTED', status: error.status || 500, retryable: false }
    }

    const status = error?.status || error?.statusCode || error?.response?.status
    const message = String(error?.message || '').toLowerCase()
    const code = String(error?.code || '').toUpperCase()

    // 401 / 403: Invalid key or permissions -> Disable key
    if (status === 401 || status === 403 || message.includes('api_key_invalid') || message.includes('api key not valid')) {
      return { type: 'AUTH_ERROR', status: status || 401, retryable: true, disableKey: true, cooldownMs: this.invalidKeyCooldownMs }
    }

    // 429: Rate limit / Quota exceeded -> Adaptive Cooldown (5s or Retry-After)
    if (status === 429 || message.includes('resource_exhausted') || message.includes('rate_limit') || message.includes('quota')) {
      let retryAfter = 0
      const retryHeader = error?.response?.headers?.['retry-after'] || error?.headers?.['retry-after']
      if (retryHeader) {
        const parsed = Number(retryHeader)
        if (!Number.isNaN(parsed) && parsed > 0) retryAfter = parsed * 1000
      }
      return { type: 'RATE_LIMIT', status: 429, retryable: true, cooldownMs: Math.max(retryAfter, 5000) }
    }

    // 408 / Timeout / Network -> 3s cooldown
    if (status === 408 || code === 'ECONNABORTED' || code === 'ETIMEDOUT' || code === 'ECONNRESET' || code === 'ECONNREFUSED' || message.includes('timeout') || message.includes('fetch failed')) {
      return { type: 'TIMEOUT_OR_NETWORK', status: status || 408, retryable: true, cooldownMs: 3000 }
    }

    // 5xx: Server errors -> 3s cooldown
    if (status >= 500 && status <= 599) {
      return { type: 'SERVER_ERROR', status, retryable: true, cooldownMs: 3000 }
    }

    // Safety / Malformed / 400 Bad Request
    if (status === 400 || message.includes('safety') || message.includes('invalid_argument') || message.includes('content_blocked')) {
      return { type: 'BAD_REQUEST_OR_SAFETY', status: status || 400, retryable: false }
    }

    // Default unknown error
    return { type: 'UNKNOWN_ERROR', status: status || 500, retryable: true, cooldownMs: 3000 }
  }

  async executeWithRetry(operationName, executeFn) {
    this.ensureKeysLoaded()
    if (!this.keys.length) {
      const err = new Error('Không có Gemini API key nào được cấu hình')
      err.code = 'CHAT_PROVIDER_UNAVAILABLE'
      err.statusCode = 503
      throw err
    }

    const attemptedIndices = new Set()
    let lastError = null
    const maxAttempts = Math.min(this.maxAttempts, this.keys.length)

    while (attemptedIndices.size < maxAttempts) {
      const keyObj = await this.acquireKeyWithWait(attemptedIndices)
      if (!keyObj) {
        break
      }

      attemptedIndices.add(keyObj.index)
      keyObj.inFlight += 1

      try {
        const result = await executeFn(keyObj)
        keyObj.consecutiveFailures = 0
        keyObj.lastErrorCode = null
        return result
      } catch (error) {
        lastError = error
        const classification = this.classifyError(error)

        keyObj.consecutiveFailures += 1
        keyObj.lastErrorCode = classification.type

        if (classification.disableKey) {
          keyObj.disabled = true
          console.error(`[GeminiKeyPool] provider=gemini keyIndex=${keyObj.index} action=disabled error=${classification.type}`)
        } else if (classification.retryable) {
          keyObj.cooldownUntil = Date.now() + classification.cooldownMs
          console.warn(`[GeminiKeyPool] provider=gemini keyIndex=${keyObj.index} action=cooldown cooldownMs=${classification.cooldownMs} error=${classification.type}`)
        }

        // If error is not retryable (e.g. 400, safety block), throw immediately
        if (!classification.retryable) {
          throw error
        }
      } finally {
        keyObj.inFlight = Math.max(0, keyObj.inFlight - 1)
      }
    }

    const exhaustedError = new Error('Dịch vụ AI đang quá tải hoặc tất cả API key đều không khả dụng, vui lòng thử lại sau.')
    exhaustedError.code = 'CHAT_PROVIDER_UNAVAILABLE'
    exhaustedError.statusCode = 503
    exhaustedError.originalError = lastError
    throw exhaustedError
  }

  getPoolStatus() {
    this.ensureKeysLoaded()
    const now = Date.now()
    return this.keys.map((k) => ({
      index: k.index,
      maskedKey: k.apiKey.length > 8 ? `${k.apiKey.slice(0, 4)}...${k.apiKey.slice(-4)}` : '****',
      inFlight: k.inFlight,
      isCooldown: k.cooldownUntil > now,
      cooldownRemainingMs: Math.max(0, k.cooldownUntil - now),
      disabled: k.disabled,
      consecutiveFailures: k.consecutiveFailures,
      lastErrorCode: k.lastErrorCode,
    }))
  }

  resetPool() {
    this.keys.forEach((k) => {
      k.inFlight = 0
      k.cooldownUntil = 0
      k.disabled = false
      k.consecutiveFailures = 0
      k.lastErrorCode = null
    })
    this.cursor = 0
  }
}

export const geminiKeyPool = new GeminiKeyPool()
export default geminiKeyPool
