import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { COMPARISON_STORAGE_KEY } from '../src/store/comparisonStore.js'

const A = '6a870328541fd91e90da7691'
const B = '6a870328541fd91e90da721f'
const C = '000000000000000000000003'
const D = '000000000000000000000004'
const E = '000000000000000000000005'
let storage
let originalStorage
let importCount = 0

function memoryStorage() {
  const values = new Map()
  return {
    getItem: (name) => values.get(name) ?? null,
    setItem: (name, value) => values.set(name, String(value)),
    removeItem: (name) => values.delete(name),
  }
}

async function reloadStore() {
  const module = await import(`../src/store/comparisonStore.js?persist-test=${++importCount}`)
  assert.equal(module.default.persist.hasHydrated(), true)
  return module.default
}

function saveState(state) {
  storage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify({ state, version: 0 }))
}

beforeEach(() => {
  originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  storage = memoryStorage()
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true })
})

afterEach(() => {
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage)
  else delete globalThis.localStorage
})

test('lưu A, B rồi khởi tạo store mới: tự khôi phục A, B theo thứ tự', async () => {
  const first = await reloadStore()
  first.getState().addProduct(A)
  first.getState().addProduct(B)
  assert.deepEqual(JSON.parse(storage.getItem(COMPARISON_STORAGE_KEY)), { state: { selectedIds: [A, B] }, version: 0 })
  const reloaded = await reloadStore()
  assert.notStrictEqual(first, reloaded)
  assert.deepEqual(reloaded.getState().selectedIds, [A, B])
})

test('xóa A được ghi lại; tải lại chỉ còn B', async () => {
  saveState({ selectedIds: [A, B] })
  const store = await reloadStore()
  assert.deepEqual(store.getState().removeProduct(A), { success: true })
  assert.deepEqual((await reloadStore()).getState().selectedIds, [B])
})

test('clearComparison lưu danh sách rỗng và lần tải sau vẫn rỗng', async () => {
  saveState({ selectedIds: [A, B] })
  const store = await reloadStore()
  assert.deepEqual(store.getState().clearComparison(), { success: true })
  assert.deepEqual(JSON.parse(storage.getItem(COMPARISON_STORAGE_KEY)).state, { selectedIds: [] })
  assert.deepEqual((await reloadStore()).getState().selectedIds, [])
})

test('chuẩn hóa ID, loại trùng và sai định dạng khi rehydrate', async () => {
  saveState({ selectedIds: [null, ` ${A.toUpperCase()} `, A, '', 'invalid', 12, { _id: B }, B, 'z'.repeat(24)] })
  assert.deepEqual((await reloadStore()).getState().selectedIds, [A, B])
})

test('5 ID hợp lệ chỉ khôi phục 3 ID đầu tiên', async () => {
  saveState({ selectedIds: [A, B, C, D, E] })
  const store = await reloadStore()
  assert.deepEqual(store.getState().selectedIds, [A, B, C])
  assert.deepEqual(store.getState().addProduct(D), { success: false, reason: 'limit_reached' })
})

test('giới hạn được áp dụng sau khi bỏ ID sai và trùng', async () => {
  saveState({ selectedIds: ['invalid', A, A, null, B, B, C, D] })
  assert.deepEqual((await reloadStore()).getState().selectedIds, [A, B, C])
})

test('chưa có dữ liệu localStorage: danh sách rỗng', async () => {
  assert.equal(storage.getItem(COMPARISON_STORAGE_KEY), null)
  assert.deepEqual((await reloadStore()).getState().selectedIds, [])
})

test('JSON hỏng hoặc envelope sai không làm crash và vẫn hoàn tất hydration', async () => {
  for (const raw of ['{broken', '[', 'null', 'true', '42', '"text"', '[]']) {
    storage.setItem(COMPARISON_STORAGE_KEY, raw)
    assert.deepEqual((await reloadStore()).getState().selectedIds, [])
  }
})

test('thiếu selectedIds hoặc selectedIds không phải mảng: dùng mảng rỗng', async () => {
  for (const state of [{}, null, { selectedIds: null }, { selectedIds: A }, { selectedIds: {} }, { selectedIds: 3 }]) {
    saveState(state)
    assert.deepEqual((await reloadStore()).getState().selectedIds, [])
  }
})

test('danh sách rỗng đã lưu được khôi phục rỗng', async () => {
  saveState({ selectedIds: [] })
  assert.deepEqual((await reloadStore()).getState().selectedIds, [])
})

test('dữ liệu lưu không thể ghi đè action hoặc đưa cache sản phẩm/token vào state', async () => {
  saveState({ selectedIds: [A], addProduct: 'hacked', removeProduct: null, clearComparison: {}, products: [{ price: 1 }], accessToken: 'test-only-token' })
  const store = await reloadStore()
  const state = store.getState()
  for (const key of ['addProduct', 'removeProduct', 'clearComparison']) assert.equal(typeof state[key], 'function')
  assert.equal('products' in state, false)
  assert.equal('accessToken' in state, false)
  assert.deepEqual(state.addProduct(B), { success: true })
  assert.deepEqual(JSON.parse(storage.getItem(COMPARISON_STORAGE_KEY)).state, { selectedIds: [A, B] })
})

test('partialize chỉ ghi selectedIds, kể cả khi state trong RAM có field khác', async () => {
  const store = await reloadStore()
  store.setState({ selectedIds: [A], products: [{ price: 1 }], loading: true, error: 'test' })
  assert.deepEqual(JSON.parse(storage.getItem(COMPARISON_STORAGE_KEY)).state, { selectedIds: [A] })
  assert.deepEqual(Object.keys((await reloadStore()).getState()).sort(), ['selectedIds', 'addProduct', 'removeProduct', 'clearComparison'].sort())
})

test('persist.rehydrate thực tế kiểm tra lại dữ liệu vừa bị sửa thủ công', async () => {
  const store = await reloadStore()
  store.getState().addProduct(A)
  saveState({ selectedIds: [B, B, 'invalid', C] })
  const add = store.getState().addProduct
  await store.persist.rehydrate()
  assert.deepEqual(store.getState().selectedIds, [B, C])
  assert.strictEqual(store.getState().addProduct, add)
})

test('storage bị chặn: store vẫn hoạt động và giữ kết quả action cũ', async () => {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get: () => { throw new Error('SecurityError') } })
  const store = await reloadStore()
  assert.deepEqual(store.getState().addProduct(A), { success: true })
  assert.deepEqual(store.getState().addProduct(A), { success: false, reason: 'duplicate' })
  assert.deepEqual(store.getState().removeProduct(A), { success: true })
  assert.deepEqual(store.getState().clearComparison(), { success: true })
})

test('ghi storage hết dung lượng không làm action thất bại hoặc mất state trong RAM', async () => {
  storage.setItem = () => { throw new Error('QuotaExceededError') }
  const store = await reloadStore()
  assert.deepEqual(store.getState().addProduct(A), { success: true })
  assert.deepEqual(store.getState().selectedIds, [A])
})
