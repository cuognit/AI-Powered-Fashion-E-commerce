import assert from 'node:assert/strict'
import test from 'node:test'
import jwt from 'jsonwebtoken'
import env from '../src/config/env.js'
import User from '../src/models/User.js'
import addressRoutes from '../src/routes/address.routes.js'
import { errorHandler } from '../src/middlewares/errorHandler.js'
import { memoryStore, payload, USER_A, USER_B } from './helpers/addressMemoryStore.js'

function dispatch(method, { userId = USER_A, body, query = {}, badToken = false, path = '/' } = {}) {
  return new Promise((resolve, reject) => {
    const headers = {}
    if (userId) {
      const token = badToken ? 'invalid' : jwt.sign({ sub: userId, type: 'access' }, env.jwtAccessSecret, { expiresIn: '1m' })
      headers.authorization = `Bearer ${token}`
    }
    const request = { method, url: path, originalUrl: `/api/addresses${path}`, headers, body, query }
    const response = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this },
      json(value) { resolve({ status: this.statusCode, body: value }); return this },
      set() { return this },
    }
    addressRoutes.handle(request, response, (error) => {
      try {
        if (error) errorHandler(error, request, response, reject)
        else response.status(404).json({ message: 'Không tìm thấy endpoint' })
      } catch (failure) { reject(failure) }
    })
  })
}

function setup(t) {
  const previousSecret = env.jwtAccessSecret
  env.jwtAccessSecret = 'address-api-unit-test-only'
  t.after(() => { env.jwtAccessSecret = previousSecret })
  t.mock.method(User, 'findById', () => ({ select: async () => ({ role: 'customer', isActive: true, passwordChangedAt: null }) }))
  return memoryStore(t)
}

test('router có đủ năm thao tác và áp dụng verifyToken trước handlers', () => {
  assert.equal(addressRoutes.stack[0].name, 'verifyToken')
  assert.deepEqual(addressRoutes.stack.slice(1).map((layer) => Object.keys(layer.route.methods)[0]), ['get', 'post', 'patch', 'patch', 'delete'])
})

test('GET/POST không JWT hoặc JWT sai trả 401 và không query AddressBook', async (t) => {
  const store = setup(t)
  for (const method of ['GET', 'POST']) {
    assert.equal((await dispatch(method, { userId: null, body: payload })).status, 401)
    assert.equal((await dispatch(method, { badToken: true, body: payload })).status, 401)
  }
  assert.equal(store.calls.queries.length, 0)
  assert.equal(store.calls.saves, 0)
})

test('GET rỗng trả 200 và không tạo document', async (t) => {
  const store = setup(t)
  const response = await dispatch('GET')
  assert.equal(response.status, 200)
  assert.deepEqual(response.body, { items: [], defaultAddressId: null, count: 0 })
  assert.equal(store.records.size, 0)
})

test('POST trả 201 với dữ liệu Zod đã trim; GET sau đó trả dữ liệu đã save trong stub', async (t) => {
  setup(t)
  const response = await dispatch('POST', { body: { ...payload, fullName: '  Người nhận Mẫu  ' } })
  assert.equal(response.status, 201)
  assert.equal(response.body.items[0].fullName, payload.fullName)
  assert.equal(response.body.items[0].isDefault, true)
  const get = await dispatch('GET')
  assert.equal(get.status, 200)
  assert.deepEqual(get.body, response.body)
})

test('POST không hợp lệ và field cấm trả 400 trước khi chạm AddressBook', async (t) => {
  const store = setup(t)
  for (const body of [{}, { ...payload, phone: 'abc' }, { ...payload, user_id: USER_B }, { ...payload, _id: USER_B }, { ...payload, isDefault: true }, { ...payload, default_address_id: USER_B }]) {
    const response = await dispatch('POST', { body })
    assert.equal(response.status, 400)
    assert.ok(response.body.details)
  }
  assert.equal(store.calls.queries.length, 0)
  assert.equal(store.calls.saves, 0)
})

test('query userId không thay được tài khoản JWT, tài khoản B không nhìn thấy A', async (t) => {
  setup(t)
  await dispatch('POST', { body: payload, query: { userId: USER_B } })
  assert.equal((await dispatch('GET', { userId: USER_B, query: { userId: USER_A } })).body.count, 0)
  assert.equal((await dispatch('GET')).body.count, 1)
})

test('vượt giới hạn hoặc duplicate key trả 409, lỗi server không lộ stack/MongoDB', async (t) => {
  const store = setup(t)
  store.seed(USER_A, 20)
  assert.equal((await dispatch('POST', { body: payload })).status, 409)
  store.records.clear()
  store.calls.failure = Object.assign(new Error('Synthetic duplicate'), { code: 11000 })
  assert.equal((await dispatch('POST', { body: payload })).status, 409)
  store.calls.failure = new Error('Synthetic private storage detail')
  t.mock.method(console, 'error', () => { })
  const response = await dispatch('POST', { body: payload })
  assert.equal(response.status, 500)
  assert.deepEqual(response.body, { message: 'Lỗi máy chủ' })
})

test('PATCH/DELETE/default thiếu JWT hoặc JWT sai trả 401 trước truy vấn', async (t) => {
  const store = setup(t)
  for (const [method, suffix] of [['PATCH', ''], ['DELETE', ''], ['PATCH', '/default']]) {
    const path = `/${'a'.repeat(24)}${suffix}`
    assert.equal((await dispatch(method, { path, body: { city: 'Mẫu' }, userId: null })).status, 401)
    assert.equal((await dispatch(method, { path, body: {}, badToken: true })).status, 401)
  }
  assert.equal(store.calls.queries.length, 0)
})

test('tất cả route param từ chối ID sai định dạng trước service', async (t) => {
  const store = setup(t)
  for (const [method, path] of [['PATCH', '/bad-id'], ['DELETE', '/bad-id'], ['PATCH', '/bad-id/default']]) {
    const result = await dispatch(method, { path, body: { city: 'Mẫu' } })
    assert.equal(result.status, 400)
    assert.ok(result.body.details.fieldErrors.addressId)
  }
  assert.equal(store.calls.queries.length, 0)
})

test('PATCH một/nhiều trường trả 200 và không làm mất các trường bỏ qua', async (t) => {
  const store = setup(t)
  const original = store.seed(USER_A, 1).addresses[0]
  const path = `/${original._id}`
  const first = await dispatch('PATCH', { path, body: { city: '  Thành phố mới  ' } })
  assert.equal(first.status, 200)
  assert.equal(first.body.items[0].city, 'Thành phố mới')
  assert.equal(first.body.items[0].phone, original.phone_number)
  const second = await dispatch('PATCH', { path, body: { fullName: 'Người nhận mới', label: '  Văn phòng  ', ward: '' } })
  assert.equal(second.status, 200)
  assert.equal(second.body.items[0].label, 'Văn phòng')
  assert.equal(second.body.items[0].city, 'Thành phố mới')
  assert.equal(second.body.defaultAddressId, String(original._id))
})

test('PATCH rỗng hoặc chứa field cấm bị từ chối, endpoint default cũng không nhận field điều khiển', async (t) => {
  const store = setup(t)
  const id = store.seed(USER_A, 1).addresses[0]._id
  for (const body of [{}, { city: 'Mẫu', _id: USER_B }, { user_id: USER_B }, { default_address_id: USER_B }, { isDefault: true }, { __v: 2 }]) {
    assert.equal((await dispatch('PATCH', { path: `/${id}`, body })).status, 400)
  }
  for (const body of [{ userId: USER_B }, { default_address_id: USER_B }, { isDefault: true }]) {
    assert.equal((await dispatch('PATCH', { path: `/${id}/default`, body })).status, 400)
  }
  assert.equal(store.calls.queries.length, 0)
  assert.equal(store.calls.saves, 0)
})

test('PATCH/DELETE/default cùng trả 404 cho ID không có hoặc thuộc user khác', async (t) => {
  const store = setup(t)
  const foreign = store.seed(USER_B, 1).addresses[0]._id
  for (const id of [foreign, 'a'.repeat(24)]) {
    for (const [method, suffix, body] of [['PATCH', '', { city: 'Mẫu' }], ['DELETE', '', undefined], ['PATCH', '/default', {}]]) {
      const result = await dispatch(method, { path: `/${id}${suffix}`, body, query: { userId: USER_B } })
      assert.equal(result.status, 404)
      assert.equal(result.body.message, 'Không tìm thấy địa chỉ trong sổ của bạn')
    }
  }
  assert.equal(store.calls.saves, 0)
})

test('đặt mặc định và DELETE cập nhật response, xóa cuối giữ sổ rỗng', async (t) => {
  const store = setup(t)
  const seeded = store.seed(USER_A, 2)
  const [a, b] = seeded.addresses.map((address) => String(address._id))
  const selected = await dispatch('PATCH', { path: `/${b}/default`, body: {} })
  assert.equal(selected.status, 200)
  assert.equal(selected.body.defaultAddressId, b)
  assert.equal(selected.body.items.filter((address) => address.isDefault).length, 1)
  assert.equal((await dispatch('PATCH', { path: `/${b}/default` })).status, 200)
  const removed = await dispatch('DELETE', { path: `/${b}` })
  assert.equal(removed.status, 200)
  assert.equal(removed.body.defaultAddressId, a)
  const last = await dispatch('DELETE', { path: `/${a}` })
  assert.equal(last.status, 200)
  assert.deepEqual(last.body, { items: [], defaultAddressId: null, count: 0 })
  assert.equal(store.records.size, 1)
  assert.equal((await dispatch('DELETE', { path: `/${a}` })).status, 404)
})
