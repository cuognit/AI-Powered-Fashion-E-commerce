import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import useComparisonStore, { MAX_COMPARISON_PRODUCTS } from '../src/store/comparisonStore.js'

// Chỉ kiểm tra state trong bộ nhớ; ID C/D là dữ liệu test, không truy vấn database.
const A = '6a870328541fd91e90da7691'
const B = '6a870328541fd91e90da721f'
const C = '000000000000000000000003'
const D = '000000000000000000000004'

beforeEach(() => {
  useComparisonStore.getState().clearComparison()
})

test('thêm A, B, từ chối A trùng, thêm C, từ chối D, xóa B và xóa toàn bộ', () => {
  const { addProduct, removeProduct, clearComparison } = useComparisonStore.getState()
  const ids = () => useComparisonStore.getState().selectedIds

  assert.deepEqual(addProduct(A), { success: true })
  assert.deepEqual(ids(), [A])
  assert.deepEqual(addProduct(B), { success: true })
  assert.deepEqual(ids(), [A, B])
  assert.deepEqual(addProduct(A), { success: false, reason: 'duplicate' })
  assert.deepEqual(ids(), [A, B])
  assert.deepEqual(addProduct(C), { success: true })
  assert.equal(ids().length, MAX_COMPARISON_PRODUCTS)
  assert.deepEqual(addProduct(D), { success: false, reason: 'limit_reached' })
  assert.deepEqual(ids(), [A, B, C])
  assert.deepEqual(removeProduct(B), { success: true })
  assert.deepEqual(ids(), [A, C])
  assert.deepEqual(clearComparison(), { success: true })
  assert.deepEqual(ids(), [])
})

test('từ chối ID sai kiểu, sai độ dài hoặc có ký tự không phải hexadecimal', () => {
  const { addProduct, removeProduct } = useComparisonStore.getState()
  addProduct(A)
  const previous = useComparisonStore.getState().selectedIds
  const invalidIds = [undefined, null, 123, true, {}, { _id: A }, [], '', '   ', 'product-A', 'a'.repeat(23), 'a'.repeat(25), 'z'.repeat(24)]

  for (const invalid of invalidIds) {
    assert.deepEqual(addProduct(invalid), { success: false, reason: 'invalid_id' })
    assert.deepEqual(removeProduct(invalid), { success: false, reason: 'invalid_id' })
    assert.strictEqual(useComparisonStore.getState().selectedIds, previous)
  }
})

test('chuẩn hóa khoảng trắng và hoa/thường để tránh ID trùng lặp', () => {
  const { addProduct, removeProduct } = useComparisonStore.getState()
  assert.deepEqual(addProduct(` ${A.toUpperCase()} `), { success: true })
  assert.deepEqual(useComparisonStore.getState().selectedIds, [A])
  assert.deepEqual(addProduct(A), { success: false, reason: 'duplicate' })
  removeProduct(A.toUpperCase())
  assert.deepEqual(useComparisonStore.getState().selectedIds, [])
})

test('sau khi xóa một sản phẩm, có thể thêm sản phẩm khác vào chỗ trống', () => {
  const { addProduct, removeProduct } = useComparisonStore.getState()
  for (const id of [A, B, C]) addProduct(id)
  removeProduct(B)
  assert.deepEqual(addProduct(D), { success: true })
  assert.deepEqual(useComparisonStore.getState().selectedIds, [A, C, D])
})

test('xóa ID chưa được chọn là thao tác an toàn và không thay đổi lựa chọn', () => {
  const { addProduct, removeProduct } = useComparisonStore.getState()
  addProduct(A)
  const previous = useComparisonStore.getState().selectedIds
  assert.deepEqual(removeProduct(B), { success: true })
  assert.strictEqual(useComparisonStore.getState().selectedIds, previous)
})

test('thêm, xóa và clear tạo mảng mới, không sửa những mảng đã đọc trước đó', () => {
  const { addProduct, removeProduct, clearComparison } = useComparisonStore.getState()
  const empty = useComparisonStore.getState().selectedIds
  addProduct(A)
  const first = useComparisonStore.getState().selectedIds
  addProduct(B)
  const second = useComparisonStore.getState().selectedIds
  removeProduct(A)
  const remaining = useComparisonStore.getState().selectedIds
  clearComparison()

  assert.deepEqual(empty, [])
  assert.deepEqual(first, [A])
  assert.deepEqual(second, [A, B])
  assert.deepEqual(remaining, [B])
  assert.notStrictEqual(first, second)
  assert.notStrictEqual(second, remaining)
  assert.notStrictEqual(remaining, useComparisonStore.getState().selectedIds)
})

test('subscriber nhận state mới, còn thao tác thêm bị từ chối không phát cập nhật', () => {
  const { addProduct } = useComparisonStore.getState()
  const updates = []
  const unsubscribe = useComparisonStore.subscribe((state) => updates.push(state.selectedIds))
  try {
    addProduct(A)
    addProduct(A)
    addProduct('invalid')
    addProduct(B)
    addProduct(C)
    addProduct(D)
    assert.deepEqual(updates, [[A], [A, B], [A, B, C]])
  } finally {
    unsubscribe()
  }
})
