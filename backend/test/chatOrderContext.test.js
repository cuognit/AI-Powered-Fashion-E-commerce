import test from 'node:test'
import assert from 'node:assert/strict'
import {
  extractOrderCode,
  getOrderContextForChat,
  isOrderQuery,
} from '../src/services/chatOrderContext.service.js'

test('ChatOrderContext: isOrderQuery identifies order-related messages and AEST codes', () => {
  assert.equal(isOrderQuery('Kiểm tra giúp tôi đơn hàng với'), true)
  assert.equal(isOrderQuery('Tình trạng mã đơn AEST-ME123-ABC như thế nào?'), true)
  assert.equal(isOrderQuery('Mã đơn AEST-ME123ABC-ABC123 đã giao chưa?'), true)
  assert.equal(isOrderQuery('Bao giờ giao hàng cho tôi?'), true)
  assert.equal(isOrderQuery('Tôi cần tìm áo sơ mi màu trắng'), false)
})

test('ChatOrderContext: extractOrderCode extracts AEST- and ORD- formatted codes', () => {
  assert.equal(extractOrderCode('Đơn của tôi là AEST-ME123-ABC'), 'AEST-ME123-ABC')
  assert.equal(extractOrderCode('Kiểm tra mã AEST-ME123ABC-ABC123 giúp tôi'), 'AEST-ME123ABC-ABC123')
  assert.equal(extractOrderCode('Đơn của tôi là ORD-20260820ABCD'), 'ORD-20260820ABCD')
  assert.equal(extractOrderCode('Mã ord-99881122 đã giao chưa?'), 'ORD-99881122')
  assert.equal(extractOrderCode('Tôi không nhớ mã'), null)
})

test('ChatOrderContext: guest receives requiresAuth prompt', async () => {
  const result = await getOrderContextForChat({
    message: 'Kiểm tra đơn hàng của tôi',
    userId: null,
  })

  assert.equal(result.requiresAuth, true)
  assert.equal(result.orders.length, 0)
  assert.ok(result.message.includes('đăng nhập'))
})
