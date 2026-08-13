import assert from 'node:assert/strict'
import test from 'node:test'
import {
  clearCredentialFailures,
  credentialLockError,
  lockStatus,
  recordCredentialFailure,
} from '../src/utils/bruteForce.js'

test('allows attempts below the maximum threshold', () => {
  clearCredentialFailures('allowed')
  const base = 1_000_000_000
  for (let i = 0; i < 4; i++) {
    assert.equal(recordCredentialFailure('allowed', {}, base + i * 1000), null, `attempt ${i + 1}`)
  }
  assert.equal(lockStatus('allowed', base + 5000), null)
})

test('locks on the attempt that reaches the maximum', () => {
  clearCredentialFailures('lock-me')
  const base = 5_000_000_000
  for (let i = 0; i < 4; i++) {
    assert.equal(recordCredentialFailure('lock-me', {}, base + i * 1000), null)
  }
  const blocked = recordCredentialFailure('lock-me', {}, base + 4000)
  assert.ok(blocked, 'fifth attempt should trigger the lock')
  assert.ok(blocked.retryAfterMs > 0)
  assert.ok(lockStatus('lock-me', base + 5000), 'should stay locked')
})

test('locked keys keep being blocked through the cooldown, then recover', () => {
  const key = 'recover'
  clearCredentialFailures(key)
  const base = 9_000_000_000
  const opts = { windowMs: 15 * 60_000, maxAttempts: 3, lockMs: 60_000 }

  for (let i = 0; i < 2; i++) recordCredentialFailure(key, opts, base + i * 1000)
  assert.ok(recordCredentialFailure(key, opts, base + 2000), 'reaching maxAttempts locks the key')

  // Still locked shortly after and during the cooldown.
  assert.ok(lockStatus(key, base + 3000))
  assert.ok(recordCredentialFailure(key, opts, base + 30_000))

  // Recovered once lockMs has passed.
  assert.equal(lockStatus(key, base + 63_000), null)
})

test('clearCredentialFailures resets the guard for a key', () => {
  const key = 'cleared'
  clearCredentialFailures(key)
  const base = 13_000_000_000
  for (let i = 0; i < 5; i++) recordCredentialFailure(key, {}, base + i * 1000)
  assert.ok(lockStatus(key, base + 5000))

  clearCredentialFailures(key)
  assert.equal(lockStatus(key, base + 5000), null)
  assert.equal(recordCredentialFailure(key, {}, base + 6000), null)
})

test('credentialLockError is a 429 carrying a Retry-After hint', () => {
  const error = credentialLockError(15 * 60_000)
  assert.equal(error.statusCode, 429)
  assert.match(error.message, /15 phút/)
  assert.equal(error.retryAfterSeconds, 900)
})