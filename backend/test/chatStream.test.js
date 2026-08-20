import test from 'node:test'
import assert from 'node:assert/strict'
import { handleChatStream } from '../src/services/chat.service.js'
import { optionalVerifyToken } from '../src/middlewares/optionalVerifyToken.js'
import { AppError } from '../src/utils/AppError.js'

test('ChatStream: rejects empty message with 400 AppError', async () => {
  await assert.rejects(
    async () => {
      await handleChatStream({ message: '   ' })
    },
    (err) => {
      assert.ok(err instanceof AppError)
      assert.equal(err.statusCode, 400)
      return true
    },
  )
})

test('ChatStream: rejects message exceeding 2000 chars with 400 AppError', async () => {
  const longText = 'a'.repeat(2001)
  await assert.rejects(
    async () => {
      await handleChatStream({ message: longText })
    },
    (err) => {
      assert.ok(err instanceof AppError)
      assert.equal(err.statusCode, 400)
      return true
    },
  )
})

test('optionalVerifyToken: allows guest access when authorization header is absent', async () => {
  const req = { headers: {} }
  let nextCalled = false
  const res = {}
  const next = () => { nextCalled = true }

  await optionalVerifyToken(req, res, next)
  assert.equal(nextCalled, true)
  assert.equal(req.user, null)
})

test('optionalVerifyToken: returns 401 when authorization header is invalid or expired', async () => {
  const req = { headers: { authorization: 'Bearer invalid_expired_jwt_token_123' } }
  let statusCode = 0
  let jsonResult = null
  const res = {
    status(code) {
      statusCode = code
      return {
        json(data) {
          jsonResult = data
        },
      }
    },
  }
  const next = () => {}

  await optionalVerifyToken(req, res, next)
  assert.equal(statusCode, 401)
  assert.ok(jsonResult?.code)
})
