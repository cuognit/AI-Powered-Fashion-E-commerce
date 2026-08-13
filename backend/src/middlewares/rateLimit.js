export class MemoryRateLimitStore {
  constructor() { this.buckets = new Map() }
  increment(key, windowMs, now = Date.now()) {
    const current = this.buckets.get(key)
    const bucket = !current || current.resetAt <= now ? { count: 0, resetAt: now + windowMs } : current
    bucket.count += 1
    this.buckets.set(key, bucket)
    return bucket
  }
}

const defaultStore = new MemoryRateLimitStore()

// A Redis adapter can replace this store by implementing increment(key, windowMs).
export function createRateLimit({ windowMs, limit, key = (request) => request.ip, store = defaultStore }) {
  return (request, response, next) => {
    const bucketKey = key(request)
    const bucket = store.increment(bucketKey, windowMs)
    response.setHeader('RateLimit-Limit', limit)
    response.setHeader('RateLimit-Remaining', Math.max(0, limit - bucket.count))
    response.setHeader('RateLimit-Reset', Math.ceil(bucket.resetAt / 1000))
    if (bucket.count > limit) return response.status(429).json({ message: 'Quá nhiều yêu cầu, vui lòng thử lại sau' })
    next()
  }
}

export const paymentRateLimit = createRateLimit({ windowMs: 15 * 60_000, limit: 5, key: (r) => `payment:${r.user?.sub || 'guest'}:${r.ip}` })
export const orderReadRateLimit = createRateLimit({ windowMs: 60_000, limit: 30, key: (r) => `order:${r.user?.sub}:${r.ip}` })
export const orderMutationRateLimit = createRateLimit({ windowMs: 15 * 60_000, limit: 20, key: (r) => `order-action:${r.user?.sub}:${r.ip}` })
export const ipnRateLimit = createRateLimit({ windowMs: 60_000, limit: 300, key: (r) => `ipn:${r.ip}` })
export const loginIpRateLimit = createRateLimit({ windowMs: 60_000, limit: 10, key: (r) => `login-ip:${r.ip}` })
