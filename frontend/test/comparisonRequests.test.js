import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { getEventListeners } from 'node:events'
import test from 'node:test'
import axios from 'axios'
import { COMPARISON_TIMEOUT_MS, requestComparisonProduct } from '../src/services/comparisonRequest.js'

const A = '6a870328541fd91e90da7691'
const B = '6a870328541fd91e90da721f'
const TIMEOUT = 25
const response = (id) => ({ data: { success: true, data: { _id: id } }, status: 200, headers: {} })
const deferred = () => {
  let resolve
  const promise = new Promise((done) => { resolve = done })
  return { promise, resolve }
}
const tick = () => new Promise((resolve) => setImmediate(resolve))

const page = readFileSync(new URL('../src/pages/shop/CompareProducts.jsx', import.meta.url), 'utf8')
const errorMessage = new Function(`${page.slice(page.indexOf('function requestErrorMessage'), page.indexOf('export default'))}; return requestErrorMessage`)()
const marker = '  useEffect(() => {'
const body = page.slice(page.indexOf(marker) + marker.length, page.indexOf('  }, [selectedIds, retryCount])'))
const effect = new Function('selectedIds', 'getComparisonProduct', 'setLoading', 'setProducts', 'setErrors', 'setLoadedIds', 'requestErrorMessage', body)

function start(ids, adapter, state = {}) {
  const configs = []
  const client = axios.create({
    adapter: (config) => {
      configs.push(config)
      return adapter(config.url.split('/').at(-1), config)
    }
  })
  let done
  const completed = new Promise((resolve) => { done = resolve })
  const cleanup = effect(ids,
    (id, options) => requestComparisonProduct(client, id, { ...options, timeout: TIMEOUT }),
    (value) => { state.loading = value; if (!value) done() },
    (value) => { state.products = value },
    (value) => { state.errors = value },
    (value) => { state.loadedIds = value }, errorMessage)
  return { state, configs, cleanup, completed }
}

test('hai API thành công: giữ thứ tự selectedIds dù B trả trước A', { timeout: 2000 }, async () => {
  const slow = deferred()
  const run = start([A, B], (id) => id === A ? slow.promise : Promise.resolve(response(B)))
  await tick()
  slow.resolve(response(A))
  await run.completed
  assert.deepEqual(run.state.products.map((p) => p._id), [A, B])
  assert.deepEqual(run.state.errors, [])
  assert.equal(run.state.loading, false)
  assert.ok(run.configs.every((config) => config.timeout === TIMEOUT && config.signal))
  run.cleanup()
})

test('một thành công, một HTTP 404: giữ sản phẩm thành công và lỗi theo ID', { timeout: 2000 }, async () => {
  const run = start([A, B], (id) => id === A ? Promise.resolve(response(A)) : Promise.reject(Object.assign(new Error('404'), { response: { status: 404 } })))
  await run.completed
  assert.deepEqual(run.state.products.map((p) => p._id), [A])
  assert.deepEqual(run.state.errors, [{ id: B, message: 'Sản phẩm không tồn tại hoặc không còn khả dụng.' }])
  run.cleanup()
})

test('một thành công, một treo: timer thật kết thúc loading, abort request và báo timeout', { timeout: 2000 }, async () => {
  const run = start([A, B], (id) => id === A ? Promise.resolve(response(A)) : new Promise(() => { }))
  await run.completed
  assert.equal(run.state.loading, false)
  assert.deepEqual(run.state.products.map((p) => p._id), [A])
  assert.equal(run.state.errors[0].id, B)
  assert.match(run.state.errors[0].message, /phản hồi quá chậm/)
  assert.equal(run.configs.find((config) => config.url.endsWith(B)).signal.aborted, true)
  run.cleanup()
})

test('cả hai API treo: timer thật kết thúc loading và trả hai lỗi', { timeout: 2000 }, async () => {
  const run = start([A, B], () => new Promise(() => { }))
  await run.completed
  assert.equal(run.state.loading, false)
  assert.deepEqual(run.state.products, [])
  assert.deepEqual(run.state.errors.map((error) => error.id), [A, B])
  assert.ok(run.state.errors.every((error) => /quá chậm/.test(error.message)))
  run.cleanup()
})

test('đổi selectedIds: cleanup abort lựa chọn cũ; chỉ cập nhật lựa chọn mới', { timeout: 2000 }, async () => {
  const state = {}
  const old = start([A], () => new Promise(() => { }), state)
  await tick()
  old.cleanup()
  const current = start([B], () => Promise.resolve(response(B)), state)
  await current.completed
  assert.equal(old.configs[0].signal.aborted, true)
  assert.deepEqual(state.loadedIds, [B])
  assert.deepEqual(state.products.map((p) => p._id), [B])
  assert.deepEqual(state.errors, [])
  current.cleanup()
})

test('unmount: hủy request, không cập nhật setter sau cleanup', { timeout: 2000 }, async () => {
  const run = start([A], () => new Promise(() => { }))
  await tick()
  run.cleanup()
  const snapshot = structuredClone(run.state)
  await tick()
  assert.equal(run.configs[0].signal.aborted, true)
  assert.deepEqual(run.state, snapshot)
})

test('retry sau timeout: effect mới tải thành công và xóa lỗi cũ', { timeout: 2000 }, async () => {
  const state = {}
  const first = start([A, B], () => new Promise(() => { }), state)
  await first.completed
  assert.equal(state.errors.length, 2)
  first.cleanup()
  const retry = start([A, B], (id) => Promise.resolve(response(id)), state)
  await retry.completed
  assert.equal(state.loading, false)
  assert.deepEqual(state.errors, [])
  assert.deepEqual(state.products.map((p) => p._id), [A, B])
  assert.match(page, /onClick=\{\(\) => setRetryCount\(\(count\) => count \+ 1\)\}/)
  retry.cleanup()
})

test('request cũ hoàn thành muộn không ghi đè dữ liệu mới', { timeout: 2000 }, async () => {
  const late = deferred()
  const state = {}
  const old = start([A], () => late.promise, state)
  await tick()
  old.cleanup()
  const current = start([B], () => Promise.resolve(response(B)), state)
  await current.completed
  const snapshot = structuredClone(state)
  late.resolve(response(A))
  await tick()
  assert.deepEqual(state, snapshot)
  current.cleanup()
})

test('hủy chủ động khác timeout; tín hiệu hủy sẵn không gửi request', async () => {
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(requestComparisonProduct({ get: () => assert.fail('Không được gọi API') }, A, { signal: controller.signal }), { code: 'ERR_CANCELED' })
  const current = new AbortController()
  const pending = requestComparisonProduct({ get: () => new Promise(() => { }) }, A, { signal: current.signal })
  current.abort()
  await assert.rejects(pending, { code: 'ERR_CANCELED' })
  assert.equal(getEventListeners(current.signal, 'abort').length, 0)
})

test('deadline vẫn kết thúc khi Axios response interceptor bị treo', { timeout: 2000 }, async () => {
  const client = axios.create({ adapter: () => Promise.resolve(response(A)) })
  client.interceptors.response.use(() => new Promise(() => { }))
  await assert.rejects(requestComparisonProduct(client, A, { timeout: TIMEOUT }), { code: 'COMPARISON_TIMEOUT' })
})

test('thành công: dọn timer/listener, không abort muộn và không đổi timeout mặc định Axios', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  let config
  const signal = new AbortController().signal
  const client = axios.create({ adapter: (value) => { config = value; return Promise.resolve(response(A)) } })
  await requestComparisonProduct(client, A, { signal })
  assert.equal(config.timeout, COMPARISON_TIMEOUT_MS)
  assert.equal(COMPARISON_TIMEOUT_MS, 12000)
  assert.equal(client.defaults.timeout, 0)
  assert.equal(getEventListeners(signal, 'abort').length, 0)
  t.mock.timers.tick(COMPARISON_TIMEOUT_MS + 1)
  assert.equal(config.signal.aborted, false)
})

test('timeout do Axios báo cũng được chuẩn hóa thành thông báo quá hạn', async () => {
  const client = axios.create({ adapter: () => Promise.reject(Object.assign(new Error('timeout'), { code: 'ECONNABORTED' })) })
  await assert.rejects(requestComparisonProduct(client, A), { code: 'COMPARISON_TIMEOUT' })
})
