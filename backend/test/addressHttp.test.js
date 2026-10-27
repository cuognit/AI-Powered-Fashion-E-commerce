import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import test from 'node:test'
import express from 'express'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import env from '../src/config/env.js'
import User from '../src/models/User.js'
import addressRoutes from '../src/routes/address.routes.js'
import { errorHandler, notFound } from '../src/middlewares/errorHandler.js'
import { memoryStore, payload, USER_A, USER_B } from './helpers/addressMemoryStore.js'

async function setup(t) {
  assert.equal(mongoose.connection.readyState, 0)
  const previousSecret = env.jwtAccessSecret
  env.jwtAccessSecret = 'address-http-test-only'
  t.after(() => { env.jwtAccessSecret = previousSecret })
  t.mock.method(User, 'findById', (id) => ({ select: async () => [USER_A, USER_B].includes(String(id)) ? { role: 'customer', isActive: true, passwordChangedAt: null } : null }))
  const store = memoryStore(t)
  const app = express()
  app.use(express.json())
  app.use('/api/addresses', addressRoutes)
  app.use(notFound)
  app.use(errorHandler)
  const server = createServer(app)
  t.after(async () => {
    server.closeAllConnections()
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
    assert.equal(mongoose.connection.readyState, 0)
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const origin = `http://127.0.0.1:${server.address().port}`
  const request = async (method = 'GET', path = '', { userId = USER_A, body, tokenKind = 'valid', rawBody } = {}) => {
    const headers = {}
    if (userId) {
      const claims = { sub: userId, type: tokenKind === 'refresh' ? 'refresh' : 'access' }
      const token = tokenKind === 'invalid' ? 'invalid' : jwt.sign(claims, env.jwtAccessSecret, { expiresIn: tokenKind === 'expired' ? -1 : '1m' })
      headers.Authorization = `Bearer ${token}`
    }
    if (body !== undefined || rawBody !== undefined) headers['Content-Type'] = 'application/json'
    const response = await fetch(`${origin}/api/addresses${path}`, {
      method, headers, body: rawBody ?? (body === undefined ? undefined : JSON.stringify(body)), signal: AbortSignal.timeout(5000),
    })
    assert.match(response.headers.get('content-type'), /application\/json/)
    return { status: response.status, body: await response.json() }
  }
  return { store, request }
}

test('HTTP: năm endpoint chạy trọn vòng CRUD qua JSON, response chỉ có hợp đồng công khai (storage stub)', async (t) => {
  const { store, request } = await setup(t)
  assert.deepEqual(await request(), { status: 200, body: { items: [], defaultAddressId: null, count: 0 } })
  assert.equal(store.calls.saves, 0, 'GET không tạo document')
  const first = await request('POST', '', { body: { ...payload, fullName: `  ${payload.fullName}  ` } })
  assert.equal(first.status, 201)
  assert.equal(first.body.items[0].fullName, payload.fullName)
  const id = first.body.items[0].id
  assert.equal(first.body.defaultAddressId, id)
  assert.deepEqual(Object.keys(first.body).sort(), ['count', 'defaultAddressId', 'items'])
  assert.deepEqual(Object.keys(first.body.items[0]).sort(), ['address', 'city', 'district', 'fullName', 'id', 'isDefault', 'label', 'phone', 'postalCode', 'ward'])
  assert.equal(String(store.records.get(USER_A)._id), USER_A)
  const edited = await request('PATCH', `/${id}`, { body: { city: '  Thành phố mới  ' } })
  assert.equal(edited.status, 200)
  assert.equal(edited.body.items[0].city, 'Thành phố mới')
  assert.equal(edited.body.items[0].phone, payload.phone)
  const second = await request('POST', '', { body: payload })
  const nextId = second.body.items[1].id
  assert.equal(second.body.defaultAddressId, id)
  const selected = await request('PATCH', `/${nextId}/default`, { body: {} })
  assert.equal(selected.status, 200)
  assert.equal(selected.body.items.filter((item) => item.isDefault).length, 1)
  assert.equal(selected.body.defaultAddressId, nextId)
  assert.equal((await request('DELETE', `/${nextId}`)).body.defaultAddressId, id)
  assert.deepEqual(await request('DELETE', `/${id}`), { status: 200, body: { items: [], defaultAddressId: null, count: 0 } })
  assert.equal(store.records.size, 1, 'xóa cuối giữ sổ rỗng')
  assert.deepEqual((await request()).body, { items: [], defaultAddressId: null, count: 0 })
})

test('HTTP: thiếu/sai/hết hạn JWT hoặc refresh token bị từ chối ở mọi endpoint trước AddressBook', async (t) => {
  const { store, request } = await setup(t)
  for (const [method, path, body] of [['GET', '', undefined], ['POST', '', payload], ['PATCH', `/${USER_A}`, { city: 'Mẫu' }], ['DELETE', `/${USER_A}`, undefined], ['PATCH', `/${USER_A}/default`, {}]]) {
    for (const options of [{ userId: null }, { tokenKind: 'invalid' }, { tokenKind: 'expired' }, { tokenKind: 'refresh' }]) {
      const response = await request(method, path, { body, ...options })
      assert.equal(response.status, 401)
      assert.deepEqual(Object.keys(response.body), ['message'])
    }
  }
  assert.equal(store.calls.queries.length, 0)
  assert.equal(store.calls.saves, 0)
})

test('HTTP: query/body không đổi chủ sở hữu; B không đọc/sửa/xóa/đặt mặc định địa chỉ của A', async (t) => {
  const { store, request } = await setup(t)
  const created = await request('POST', `?userId=${USER_B}`, { body: payload })
  const id = created.body.items[0].id
  assert.equal(store.records.has(USER_A), true)
  assert.deepEqual((await request('GET', `?userId=${USER_A}`, { userId: USER_B })).body, { items: [], defaultAddressId: null, count: 0 })
  for (const [method, suffix, body] of [['PATCH', '', { city: 'Mẫu' }], ['DELETE', '', undefined], ['PATCH', '/default', {}]]) {
    const response = await request(method, `/${id}${suffix}?userId=${USER_A}`, { userId: USER_B, body })
    assert.equal(response.status, 404)
    assert.equal(JSON.stringify(response.body).includes(id), false)
    assert.equal(JSON.stringify(response.body).includes(payload.phone), false)
  }
  assert.equal((await request('POST', '', { body: { ...payload, userId: USER_B } })).status, 400)
  assert.equal(store.calls.saves, 1)
  assert.equal((await request()).body.count, 1)
})

test('HTTP: JSON parser, Zod body và route params từ chối request sai trước service', async (t) => {
  const { store, request } = await setup(t)
  const invalid = await request('POST', '', { body: { ...payload, phone: 'abc' } })
  assert.equal(invalid.status, 400)
  assert.ok(invalid.body.details.fieldErrors.phone.length)
  assert.equal((await request('POST', '', { rawBody: '{' })).status, 400)
  assert.equal((await request('PATCH', `/${USER_A}`, { body: {} })).status, 400)
  assert.equal((await request('PATCH', `/${USER_A}/default`, { body: { default_address_id: USER_B } })).status, 400)
  for (const [method, path] of [['PATCH', '/bad-id'], ['DELETE', '/bad-id'], ['PATCH', '/bad-id/default']]) {
    const response = await request(method, path, { body: method === 'PATCH' ? {} : undefined })
    assert.equal(response.status, 400)
    assert.ok(response.body.details.fieldErrors.addressId.length)
    assert.equal(Object.hasOwn(response.body, 'stack'), false)
  }
  assert.equal(store.calls.queries.length, 0)
  assert.equal(store.calls.saves, 0)
})

test('HTTP: VersionError/duplicate key giả lập thành 409; lỗi 500 không lộ chi tiết lưu trữ', async (t) => {
  const { store, request } = await setup(t)
  const book = store.seed(USER_A, 2)
  const id = String(book.addresses[1]._id)
  for (const failure of [new mongoose.Error.VersionError(book, 0, ['addresses']), Object.assign(new Error('Synthetic private duplicate'), { code: 11000 })]) {
    store.calls.failure = failure
    for (const [method, path, body] of [['POST', '', payload], ['PATCH', `/${id}`, { city: 'Mẫu' }], ['DELETE', `/${id}`, undefined], ['PATCH', `/${id}/default`, {}]]) {
      const response = await request(method, path, { body })
      assert.equal(response.status, 409)
      assert.deepEqual(Object.keys(response.body), ['message'])
      assert.equal(response.body.message.includes('Synthetic'), false)
    }
  }
  store.calls.failure = new Error('Synthetic private storage detail')
  t.mock.method(console, 'error', () => { })
  assert.deepEqual(await request('POST', '', { body: payload }), { status: 500, body: { message: 'Lỗi máy chủ' } })
  store.calls.failure = null
  assert.equal((await request()).body.count, 2)
})
