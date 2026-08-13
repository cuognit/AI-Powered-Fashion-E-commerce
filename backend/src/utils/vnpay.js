import { createHmac, timingSafeEqual } from 'node:crypto'

function encode(value) {
  return encodeURIComponent(String(value)).replace(/%20/g, '+')
}

export function canonicalizeVnpayParams(params) {
  return Object.entries(params)
    .filter(([key, value]) => key.startsWith('vnp_') && key !== 'vnp_SecureHash' && key !== 'vnp_SecureHashType' && value !== undefined && value !== null && value !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${encode(key)}=${encode(value)}`)
    .join('&')
}

export function signVnpayParams(params, secret) {
  return createHmac('sha512', secret).update(canonicalizeVnpayParams(params), 'utf8').digest('hex')
}

export function verifyVnpaySignature(params, secret) {
  const received = String(params.vnp_SecureHash || '').toLowerCase()
  const expected = signVnpayParams(params, secret)
  if (!/^[a-f0-9]{128}$/.test(received)) return false
  return timingSafeEqual(Buffer.from(received, 'hex'), Buffer.from(expected, 'hex'))
}

export function createVnpayUrl(baseUrl, params, secret) {
  const query = canonicalizeVnpayParams(params)
  const signature = signVnpayParams(params, secret)
  return `${baseUrl}?${query}&vnp_SecureHash=${signature}`
}

export function formatVnpayDate(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(date).reduce((result, part) => ({ ...result, [part.type]: part.value }), {})
  return `${parts.year}${parts.month}${parts.day}${parts.hour}${parts.minute}${parts.second}`
}
