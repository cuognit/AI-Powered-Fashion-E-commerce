import { AppError } from './AppError.js'

// The guard is account-scoped so a single source cannot brute-force an account
// and a botnet cannot run past the lock by spraying from many IPs. Buckets live
// in memory; swap for Redis (or the DB) in a multi-instance deployment.
export const LOGIN_MAX_ATTEMPTS = 5 // wrong attempts allowed before locking
export const LOGIN_WINDOW_MS = 15 * 60_000 // window in which attempts are counted
export const LOGIN_LOCK_MS = 15 * 60_000 // cooldown after being locked

const buckets = new Map()

function prune(bucket, windowMs, now) {
  bucket.failures = bucket.failures.filter((timestamp) => now - timestamp < windowMs)
}

/** Returns `{ retryAfterMs }` when the key is currently locked, or `null`. */
export function lockStatus(key, now = Date.now()) {
  const bucket = buckets.get(key)
  if (!bucket || bucket.lockedUntil <= now) return null
  return { retryAfterMs: bucket.lockedUntil - now }
}

/**
 * Records one failed credential check. Returns a lock payload when the request
 * should be blocked (already locked, or this attempt exceeded the limit), or
 * `null` to allow the attempt to proceed.
 */
export function recordCredentialFailure(
  key,
  { windowMs = LOGIN_WINDOW_MS, maxAttempts = LOGIN_MAX_ATTEMPTS, lockMs = LOGIN_LOCK_MS } = {},
  now = Date.now(),
) {
  const existing = lockStatus(key, now)
  if (existing) return existing

  let bucket = buckets.get(key)
  if (!bucket) {
    bucket = { failures: [], lockedUntil: 0 }
    buckets.set(key, bucket)
  }

  prune(bucket, windowMs, now)
  bucket.failures.push(now)

  if (bucket.failures.length >= maxAttempts) {
    bucket.lockedUntil = now + lockMs
    return { retryAfterMs: lockMs }
  }

  return null
}

/** Clears any recorded failures after a successful credential check. */
export function clearCredentialFailures(key) {
  buckets.delete(key)
}

/** Builds the 429 error surfaced to the client while the guard is active. */
export function credentialLockError(retryAfterMs) {
  const minutes = Math.ceil(retryAfterMs / 60_000)
  const error = new AppError(
    `Quá nhiều lần nhập sai, tạm khóa ${minutes} phút. Vui lòng thử lại sau.`,
    429,
  )
  error.retryAfterSeconds = Math.ceil(retryAfterMs / 1000)
  return error
}