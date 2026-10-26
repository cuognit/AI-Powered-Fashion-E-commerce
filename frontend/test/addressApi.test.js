import assert from 'node:assert/strict'
import test from 'node:test'
import axios from 'axios'
import { getEventListeners } from 'node:events'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' })
test.after(async () => { await server.close() })
const api = await server.ssrLoadModule('/src/services/addressApi.js')
const { default: client } = await server.ssrLoadModule('/src/services/axiosClient.js')

function adapter(t, handler) {
  const previous = client.defaults.adapter
  client.defaults.adapter = handler
  t.after(() => { client.defaults.adapter = previous })
}

test('getAddresses dùng axiosClient, endpoint đúng, signal và timeout', async (t) => {
  let request
  adapter(t, async (config) => { request = config; return { status: 200, data: { items: [], count: 0, defaultAddressId: null }, headers: {}, config } })
  const signal = new AbortController().signal
  const result = await api.getAddresses({ signal })
  assert.equal(request.url, '/addresses')
  assert.equal(request.method, 'get')
  assert.equal(request.withCredentials, true)
  assert.equal(request.signal.aborted, false)
  assert.equal(getEventListeners(signal, 'abort').length, 0)
  assert.equal(request.timeout, 15000)
  assert.equal(result.data.count, 0)
})

test('createAddress gửi JSON một lần và trả danh sách server', async (t) => {
  let request
  adapter(t, async (config) => { request = config; return { status: 201, data: { items: [{ id: 'server-id' }], count: 1 }, headers: {}, config } })
  const payload = { fullName: 'Người nhận Mẫu', phone: '000 000 0001', address: 'Địa chỉ Mẫu', city: 'Thành phố Mẫu' }
  const response = await api.createAddress(payload)
  assert.equal(request.url, '/addresses')
  assert.equal(request.method, 'post')
  assert.deepEqual(JSON.parse(request.data), payload)
  assert.equal(response.status, 201)
  assert.equal(response.data.items[0].id, 'server-id')
})

test('409 được chuyển về caller, không tự POST lại', async (t) => {
  let calls = 0
  adapter(t, async (config) => {
    calls += 1
    throw new axios.AxiosError('Conflict', 'ERR_BAD_REQUEST', config, null, { status: 409, data: { message: 'Conflict' }, headers: {}, config })
  })
  await assert.rejects(() => api.createAddress({}), (error) => error.response.status === 409)
  assert.equal(calls, 1)
})

test('update/delete/default dùng đúng method, URL, body, signal và timeout', async (t) => {
  const requests = []
  adapter(t, async (config) => { requests.push(config); return { status: 200, data: { items: [], count: 0, defaultAddressId: null }, headers: {}, config } })
  const signal = new AbortController().signal
  await api.updateAddress('sample/id', { city: 'Mẫu' }, { signal })
  await api.deleteAddress('sample/id', { signal })
  await api.setDefaultAddress('sample/id', { signal })
  assert.deepEqual(requests.map((request) => [request.method, request.url]), [['patch', '/addresses/sample%2Fid'], ['delete', '/addresses/sample%2Fid'], ['patch', '/addresses/sample%2Fid/default']])
  assert.deepEqual(JSON.parse(requests[0].data), { city: 'Mẫu' })
  assert.equal(requests[1].data, undefined)
  assert.deepEqual(JSON.parse(requests[2].data), {})
  for (const request of requests) {
    assert.equal(request.signal.aborted, false)
    assert.equal(request.timeout, 15000)
  }
})

test('PATCH/DELETE/default không tự retry sau 404/409', async (t) => {
  let calls = 0
  let status = 404
  adapter(t, async (config) => {
    calls += 1
    throw new axios.AxiosError('Request failed', 'ERR_BAD_REQUEST', config, null, { status, data: { message: 'Request failed' }, headers: {}, config })
  })
  for (const code of [404, 409]) {
    status = code
    for (const operation of [() => api.updateAddress('id', { label: 'Mẫu' }), () => api.deleteAddress('id'), () => api.setDefaultAddress('id')]) {
      await assert.rejects(operation, (error) => error.response.status === code)
    }
  }
  assert.equal(calls, 6)
})

test('GET treo phải kết thúc theo deadline Address Book, không chỉ cấu hình timeout của adapter', async (t) => {
  adapter(t, () => new Promise(() => { }))
  let guard
  try {
    const result = await Promise.race([
      api.getAddresses({ timeout: 15 }).then(() => 'unexpected success', (error) => error.code),
      new Promise((resolve) => { guard = setTimeout(() => resolve('still pending'), 150) }),
    ])
    assert.equal(result, 'ECONNABORTED')
  } finally { clearTimeout(guard) }
})

test('mọi mutation treo đều kết thúc, abort transport và không retry', async (t) => {
  const requests = []
  adapter(t, (config) => { requests.push(config); return new Promise(() => { }) })
  for (const operation of [() => api.createAddress({}, { timeout: 15 }), () => api.updateAddress('id', {}, { timeout: 15 }), () => api.deleteAddress('id', { timeout: 15 }), () => api.setDefaultAddress('id', { timeout: 15 })]) {
    await assert.rejects(operation, (error) => error.code === 'ECONNABORTED' && error.addressRequestStarted === true)
    assert.equal(requests.at(-1).signal.aborted, true)
  }
  assert.equal(requests.length, 4)
})

test('caller abort sau khi bắt đầu: trả cancellation có metadata, cleanup listener', async (t) => {
  let request
  adapter(t, (config) => { request = config; return new Promise(() => { }) })
  const controller = new AbortController()
  const pending = api.createAddress({}, { signal: controller.signal, timeout: 1000 })
  await new Promise((resolve) => setImmediate(resolve))
  assert.equal(getEventListeners(controller.signal, 'abort').length, 1)
  controller.abort()
  await assert.rejects(() => pending, (error) => error.code === 'ERR_CANCELED' && error.addressRequestStarted === true)
  assert.equal(request.signal.aborted, true)
  assert.equal(getEventListeners(controller.signal, 'abort').length, 0)
})

test('signal đã hủy trước lời gọi thì không gửi POST', async (t) => {
  let calls = 0
  adapter(t, async () => { calls += 1; throw new Error('Không được chạy adapter') })
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(() => api.createAddress({}, { signal: controller.signal }), (error) => error.code === 'ERR_CANCELED' && error.addressRequestStarted === false)
  assert.equal(calls, 0)
  assert.equal(getEventListeners(controller.signal, 'abort').length, 0)
})

test('thành công cleanup timer/listener, abort caller về sau không tác động request đã xong', async (t) => {
  let request
  adapter(t, async (config) => { request = config; return { status: 200, data: { items: [], count: 0 }, headers: {}, config } })
  const controller = new AbortController()
  await api.getAddresses({ signal: controller.signal, timeout: 15 })
  assert.equal(getEventListeners(controller.signal, 'abort').length, 0)
  controller.abort()
  await new Promise((resolve) => setTimeout(resolve, 25))
  assert.equal(request.signal.aborted, false)
})

test('response đến sau timeout không biến request đã thất bại thành thành công', async (t) => {
  let finish
  let request
  adapter(t, (config) => { request = config; return new Promise((resolve) => { finish = resolve }) })
  const pending = api.getAddresses({ timeout: 15 })
  await assert.rejects(() => pending, (error) => error.code === 'ECONNABORTED')
  finish({ status: 200, data: { items: [{ id: 'late' }], count: 1 }, headers: {}, config: request })
  await new Promise((resolve) => setImmediate(resolve))
  assert.equal(request.signal.aborted, true)
})
