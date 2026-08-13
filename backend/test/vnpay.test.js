import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import test from 'node:test'
import { canonicalizeVnpayParams, createVnpayUrl, formatVnpayDate, signVnpayParams, verifyVnpaySignature } from '../src/utils/vnpay.js'
import { checkoutSchema } from '../src/validations/checkoutValidation.js'
import { signQueryRequest, signQueryResponse, verifyQueryResponse } from '../src/utils/vnpayQuery.js'

test('canonical query is sorted, encoded and excludes signature fields', () => {
  assert.equal(canonicalizeVnpayParams({ vnp_TxnRef: '2', ignored: 'x', vnp_OrderInfo: 'Đơn hàng 1', vnp_SecureHash: 'bad' }), 'vnp_OrderInfo=%C4%90%C6%A1n+h%C3%A0ng+1&vnp_TxnRef=2')
})

test('signature round-trip succeeds and rejects tampering', () => {
  const params = { vnp_Amount: 29900000, vnp_TmnCode: 'TEST', vnp_TxnRef: '123' }
  const signed = { ...params, vnp_SecureHash: signVnpayParams(params, 'secret') }
  assert.equal(verifyVnpaySignature(signed, 'secret'), true)
  assert.equal(verifyVnpaySignature({ ...signed, vnp_Amount: 1 }, 'secret'), false)
})

test('payment URL contains amount and HMAC SHA-512', () => {
  const url = createVnpayUrl('https://example.test/pay', { vnp_Amount: 12500000, vnp_TxnRef: 'abc' }, 'secret')
  assert.match(url, /vnp_Amount=12500000/)
  assert.match(url, /vnp_SecureHash=[a-f0-9]{128}$/)
})

test('VNPAY date is formatted in GMT+7', () => {
  assert.equal(formatVnpayDate(new Date('2026-08-12T03:04:05.000Z')), '20260812100405')
})

test('checkout validation strips client totals and normalizes coupon', () => {
  const parsed = checkoutSchema.parse({ fullName: ' Nguyen Van A ', phone: '0912345678', address: '1 Nguyen Hue', city: 'HCM', coupon: 'aest10', total: 1 })
  assert.equal(parsed.coupon, 'AEST10')
  assert.equal('total' in parsed, false)
})

test('checkout validation rejects malformed contact details', () => {
  assert.equal(checkoutSchema.safeParse({ fullName: 'A', phone: 'abc', address: 'x', city: 'x' }).success, false)
})

test('QueryDR request uses the documented pipe-delimited HMAC', () => {
  const params = { vnp_RequestId: '1', vnp_Version: '2.1.0', vnp_Command: 'querydr', vnp_TmnCode: 'TEST0001', vnp_TxnRef: 'ABC', vnp_TransactionDate: '20260812100000', vnp_CreateDate: '20260812103000', vnp_IpAddr: '127.0.0.1', vnp_OrderInfo: 'Truy van' }
  const expected = createHmac('sha512', 'secret').update('1|2.1.0|querydr|TEST0001|ABC|20260812100000|20260812103000|127.0.0.1|Truy van').digest('hex')
  assert.equal(signQueryRequest(params, 'secret'), expected)
})

test('QueryDR response checksum rejects changed transaction status', () => {
  const response = { vnp_ResponseId: '1', vnp_Command: 'querydr', vnp_ResponseCode: '00', vnp_Message: 'Success', vnp_TmnCode: 'TEST0001', vnp_TxnRef: 'ABC', vnp_Amount: '1000000', vnp_BankCode: 'NCB', vnp_PayDate: '20260812100000', vnp_TransactionNo: '123', vnp_TransactionType: '01', vnp_TransactionStatus: '00', vnp_OrderInfo: 'Order', vnp_PromotionCode: '', vnp_PromotionAmount: '' }
  response.vnp_SecureHash = signQueryResponse(response, 'secret')
  assert.equal(verifyQueryResponse(response, 'secret'), true)
  assert.equal(verifyQueryResponse({ ...response, vnp_TransactionStatus: '02' }, 'secret'), false)
})
