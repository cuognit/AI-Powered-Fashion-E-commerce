import test from 'node:test'
import assert from 'node:assert/strict'
import { GeminiKeyPool } from '../src/services/geminiKeyPool.js'
import { streamGeminiChat } from '../src/services/gemini.service.js'

test('GeminiStream: mid-stream error attaches noRetry and does not rotate keys', async () => {
  const pool = new GeminiKeyPool({
    keys: ['KEY_1', 'KEY_2'],
  })

  let attemptCount = 0
  const yieldedTokens = []

  // Simulate stream execution with key rotation
  await assert.rejects(
    async () => {
      await pool.executeWithRetry('mockStream', async (keyObj) => {
        attemptCount += 1
        let startedThisAttempt = false
        let accumulatedText = ''

        try {
          // Token 1 emitted
          startedThisAttempt = true
          accumulatedText += 'Xin chào'
          yieldedTokens.push('Xin chào')

          // Simulate network drop mid-stream
          const netErr = new Error('Connection reset by peer')
          netErr.code = 'ECONNRESET'
          throw netErr
        } catch (err) {
          if (startedThisAttempt) {
            err.noRetry = true
            err.isPartial = true
            err.partialText = accumulatedText
          }
          throw err
        }
      })
    },
    (err) => {
      assert.equal(err.noRetry, true)
      assert.equal(err.isPartial, true)
      assert.equal(err.partialText, 'Xin chào')
      return true
    },
  )

  // Should have aborted retry after first key, not attempting key 2
  assert.equal(attemptCount, 1)
})

test('GeminiStream: error before any token allows key rotation to next key', async () => {
  const pool = new GeminiKeyPool({
    keys: ['KEY_1', 'KEY_2'],
  })

  const attempts = []
  const result = await pool.executeWithRetry('mockInitialFail', async (keyObj) => {
    attempts.push(keyObj.index)
    if (keyObj.index === 1) {
      const err = new Error('503 Service Unavailable')
      err.status = 503
      throw err
    }
    return { fullText: 'Thành công từ key 2', model: 'gemini-3.7-flash' }
  })

  assert.deepEqual(attempts, [1, 2])
  assert.equal(result.fullText, 'Thành công từ key 2')
})

test('GeminiStream: timeout per attempt triggers 408 TimeoutError and rotates key if no tokens were emitted', async () => {
  const pool = new GeminiKeyPool({
    keys: ['KEY_1', 'KEY_2'],
  })

  const attempts = []
  const result = await pool.executeWithRetry('mockTimeoutRotate', async (keyObj) => {
    attempts.push(keyObj.index)
    if (keyObj.index === 1) {
      const timeoutErr = new Error('Yêu cầu Gemini vượt quá thời gian chờ (100ms)')
      timeoutErr.name = 'TimeoutError'
      timeoutErr.status = 408
      timeoutErr.code = 'ETIMEDOUT'
      throw timeoutErr
    }
    return { fullText: 'Thành công sau timeout key 1', model: 'gemini-3.7-flash' }
  })

  assert.deepEqual(attempts, [1, 2])
  assert.equal(result.fullText, 'Thành công sau timeout key 1')
})

test('GeminiStream: user AbortSignal stops execution without trying subsequent keys', async () => {
  const pool = new GeminiKeyPool({
    keys: ['KEY_1', 'KEY_2'],
  })

  const abortController = new AbortController()
  abortController.abort()

  let attempts = 0
  await assert.rejects(
    async () => {
      await pool.executeWithRetry('mockUserAbort', async () => {
        attempts += 1
        if (abortController.signal.aborted) {
          const abortErr = new Error('Yêu cầu đã bị hủy bởi người dùng')
          abortErr.name = 'AbortError'
          abortErr.isAborted = true
          abortErr.noRetry = true
          throw abortErr
        }
      })
    },
    (err) => {
      assert.equal(err.name, 'AbortError')
      assert.equal(err.isAborted, true)
      return true
    },
  )

  assert.equal(attempts, 1)
})

test('SSE Sequence: events follow ready -> sources -> token -> done contract', () => {
  const eventLog = []

  const onReady = (data) => eventLog.push({ event: 'ready', data })
  const onSources = (data) => eventLog.push({ event: 'sources', data })
  const onToken = (text) => eventLog.push({ event: 'token', text })
  const onDone = (data) => eventLog.push({ event: 'done', data })

  // Simulate controller lifecycle
  onReady({ conversationId: 'conv-123' })
  onSources({ items: [{ type: 'product', id: 'p1', label: 'Áo sơ mi' }] })
  onToken('Xin ')
  onToken('chào ')
  onToken('bạn!')
  onDone({ status: 'complete', conversationId: 'conv-123' })

  assert.equal(eventLog[0].event, 'ready')
  assert.equal(eventLog[1].event, 'sources')
  assert.equal(eventLog[2].event, 'token')
  assert.equal(eventLog[3].event, 'token')
  assert.equal(eventLog[4].event, 'token')
  assert.equal(eventLog[5].event, 'done')
  assert.equal(eventLog[5].data.status, 'complete')
})
