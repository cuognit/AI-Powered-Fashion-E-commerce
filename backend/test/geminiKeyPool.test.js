import test from 'node:test'
import assert from 'node:assert/strict'
import { GeminiKeyPool } from '../src/services/geminiKeyPool.js'

test('GeminiKeyPool: initializes with given keys and round-robins', async () => {
  const pool = new GeminiKeyPool({
    keys: ['KEY_1', 'KEY_2', 'KEY_3', 'KEY_4', 'KEY_5'],
    maxInFlightPerKey: 2,
    maxAttempts: 5,
  })

  assert.equal(pool.keys.length, 5)
  assert.equal(pool.keys[0].index, 1)
  assert.equal(pool.keys[4].index, 5)

  // 1st request -> Key 1
  const k1 = pool.getAvailableKey(new Set())
  assert.equal(k1.index, 1)

  // 2nd request -> Key 2
  const k2 = pool.getAvailableKey(new Set())
  assert.equal(k2.index, 2)

  // 3rd request -> Key 3
  const k3 = pool.getAvailableKey(new Set())
  assert.equal(k3.index, 3)
})

test('GeminiKeyPool: skips keys on cooldown or reaching max inFlight', async () => {
  const pool = new GeminiKeyPool({
    keys: ['KEY_1', 'KEY_2'],
    maxInFlightPerKey: 1,
  })

  // Set Key 1 to cooldown
  pool.keys[0].cooldownUntil = Date.now() + 10000

  const selected = pool.getAvailableKey(new Set())
  assert.equal(selected.index, 2)

  // Set Key 2 inFlight to max (1)
  pool.keys[1].inFlight = 1

  const noKey = pool.getAvailableKey(new Set())
  assert.equal(noKey, null)
})

test('GeminiKeyPool: rotates to next key on 429 rate limit', async () => {
  const pool = new GeminiKeyPool({
    keys: ['KEY_1', 'KEY_2'],
    keyCooldownMs: 20000,
  })

  const calls = []
  const result = await pool.executeWithRetry('testOp', async (keyObj) => {
    calls.push(keyObj.index)
    if (keyObj.index === 1) {
      const err = new Error('Resource has been exhausted (e.g. check quota).')
      err.status = 429
      throw err
    }
    return `success-key-${keyObj.index}`
  })

  assert.deepEqual(calls, [1, 2])
  assert.equal(result, 'success-key-2')
  assert.equal(pool.keys[0].lastErrorCode, 'RATE_LIMIT')
  assert.ok(pool.keys[0].cooldownUntil > Date.now())
})

test('GeminiKeyPool: disables key on 401/403 auth error', async () => {
  const pool = new GeminiKeyPool({
    keys: ['KEY_1', 'KEY_2'],
  })

  const result = await pool.executeWithRetry('testAuthOp', async (keyObj) => {
    if (keyObj.index === 1) {
      const err = new Error('API_KEY_INVALID')
      err.status = 401
      throw err
    }
    return `success-${keyObj.index}`
  })

  assert.equal(result, 'success-2')
  assert.equal(pool.keys[0].disabled, true)
})

test('GeminiKeyPool: does not rotate on 400 Bad Request error', async () => {
  const pool = new GeminiKeyPool({
    keys: ['KEY_1', 'KEY_2'],
  })

  let attempts = 0
  await assert.rejects(
    async () => {
      await pool.executeWithRetry('testBadReq', async () => {
        attempts += 1
        const err = new Error('Invalid request content payload')
        err.status = 400
        throw err
      })
    },
    (err) => err.status === 400,
  )

  // Should have tried only 1 key before failing immediately
  assert.equal(attempts, 1)
})

test('GeminiKeyPool: throws 503 CHAT_PROVIDER_UNAVAILABLE when all keys fail', async () => {
  const pool = new GeminiKeyPool({
    keys: ['KEY_1', 'KEY_2'],
  })

  await assert.rejects(
    async () => {
      await pool.executeWithRetry('testAllFail', async (keyObj) => {
        const err = new Error(`Server error on key ${keyObj.index}`)
        err.status = 503
        throw err
      })
    },
    (err) => {
      assert.equal(err.code, 'CHAT_PROVIDER_UNAVAILABLE')
      assert.equal(err.statusCode, 503)
      return true
    },
  )
})

test('GeminiKeyPool: does not rotate on AbortError', async () => {
  const pool = new GeminiKeyPool({
    keys: ['KEY_1', 'KEY_2'],
  })

  let attempts = 0
  await assert.rejects(
    async () => {
      await pool.executeWithRetry('testAbort', async () => {
        attempts += 1
        const abortErr = new Error('Yêu cầu đã bị hủy bởi người dùng')
        abortErr.name = 'AbortError'
        abortErr.isAborted = true
        throw abortErr
      })
    },
    (err) => err.name === 'AbortError',
  )

  assert.equal(attempts, 1)
})

test('GeminiKeyPool: does not rotate when noRetry flag is set on mid-stream error', async () => {
  const pool = new GeminiKeyPool({
    keys: ['KEY_1', 'KEY_2'],
  })

  let attempts = 0
  await assert.rejects(
    async () => {
      await pool.executeWithRetry('testNoRetry', async () => {
        attempts += 1
        const midStreamErr = new Error('Stream connection dropped')
        midStreamErr.noRetry = true
        midStreamErr.isPartial = true
        throw midStreamErr
      })
    },
    (err) => err.noRetry === true,
  )

  assert.equal(attempts, 1)
})

test('GeminiKeyPool: getPoolStatus masks API keys securely', () => {
  const pool = new GeminiKeyPool({
    keys: ['AIzaSyCgZzzDCOC7MxdK6u9curizXS_Np8gopAk'],
  })

  const status = pool.getPoolStatus()
  assert.equal(status.length, 1)
  assert.equal(status[0].maskedKey, 'AIza...opAk')
  assert.equal(status[0].inFlight, 0)
})

