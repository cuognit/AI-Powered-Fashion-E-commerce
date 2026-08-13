import assert from 'node:assert/strict'
import test from 'node:test'
import { allocateReorderQuantity, allowedAdminTransitions, canAdminFulfill, escapeRegex, legacyStatusHistory, paymentStatusAfterReceived } from '../src/utils/order.js'
import { cancelOrderSchema, updateOrderStatusSchema } from '../src/validations/orderValidation.js'

test('admin order transitions are forward-only and terminal states stay terminal', () => {
  assert.deepEqual(allowedAdminTransitions('pending'), ['processing', 'ready_to_ship', 'shipped', 'canceled'])
  assert.deepEqual(allowedAdminTransitions('processing'), ['ready_to_ship', 'shipped', 'canceled'])
  assert.deepEqual(allowedAdminTransitions('ready_to_ship'), ['shipped'])
  assert.deepEqual(allowedAdminTransitions('shipped'), [])
  assert.deepEqual(allowedAdminTransitions('completed'), [])
  assert.deepEqual(allowedAdminTransitions('canceled'), [])
})

test('reorder allocation respects existing cart quantity and current stock', () => {
  assert.equal(allocateReorderQuantity(3, 0, 5), 3)
  assert.equal(allocateReorderQuantity(3, 4, 5), 1)
  assert.equal(allocateReorderQuantity(2, 5, 5), 0)
})

test('search escapes regular expression metacharacters', () => {
  assert.equal(escapeRegex('AEST.*[1]'), 'AEST\\.\\*\\[1\\]')
})

test('legacy orders receive safe synthetic history', () => {
  const createdAt = new Date('2026-01-01T00:00:00Z')
  const updatedAt = new Date('2026-01-02T00:00:00Z')
  assert.deepEqual(legacyStatusHistory({ status: 'shipped', payment_status: 'paid', createdAt, updatedAt }).map((entry) => entry.event), ['order_created', 'shipped'])
})

test('shipping transition requires carrier and tracking code', () => {
  assert.equal(updateOrderStatusSchema.safeParse({ status: 'shipped' }).success, false)
  assert.equal(updateOrderStatusSchema.safeParse({ status: 'shipped', carrier: 'GHN', trackingCode: 'GHN123' }).success, true)
})

test('admin validation rejects customer-only completion', () => {
  assert.equal(updateOrderStatusSchema.safeParse({ status: 'completed' }).success, false)
  assert.equal(updateOrderStatusSchema.safeParse({ status: 'ready_to_ship' }).success, true)
})

test('customer cancellation accepts only configured reasons', () => {
  assert.equal(cancelOrderSchema.safeParse({ reasonCode: 'changed_mind' }).success, true)
  assert.equal(cancelOrderSchema.safeParse({ reasonCode: 'invalid' }).success, false)
})

test('fulfillment payment rules separate VNPAY and COD', () => {
  assert.equal(canAdminFulfill('VNPAY', 'paid'), true)
  assert.equal(canAdminFulfill('VNPAY', 'pending_payment'), false)
  assert.equal(canAdminFulfill('COD', 'cod_pending'), true)
  assert.equal(canAdminFulfill('COD', 'paid'), false)
})

test('customer receipt marks COD paid without changing VNPAY payment', () => {
  assert.equal(paymentStatusAfterReceived('COD', 'cod_pending'), 'paid')
  assert.equal(paymentStatusAfterReceived('VNPAY', 'paid'), 'paid')
})
