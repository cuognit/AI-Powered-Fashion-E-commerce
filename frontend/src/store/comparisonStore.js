import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const MAX_COMPARISON_PRODUCTS = 3
export const COMPARISON_STORAGE_KEY = 'aesthetix:comparison'

function normalizeProductId(productId) {
  if (typeof productId !== 'string') return null
  const id = productId.trim().toLowerCase()
  return /^[a-f\d]{24}$/.test(id) ? id : null
}

function restoreSelectedIds(value) {
  if (!Array.isArray(value)) return []
  const selectedIds = []
  const seen = new Set()
  for (const productId of value) {
    const id = normalizeProductId(productId)
    if (!id || seen.has(id)) continue
    seen.add(id)
    selectedIds.push(id)
    if (selectedIds.length === MAX_COMPARISON_PRODUCTS) break
  }
  return selectedIds
}

// Persist truyền vào/nhận lại object { state, version }; localStorage chỉ lưu chuỗi.
// Trình duyệt có thể chặn storage hoặc chứa JSON hỏng: khi đó vẫn dùng state trong RAM.
const comparisonStorage = {
  getItem: (name) => {
    try {
      const raw = globalThis.localStorage?.getItem(name)
      if (!raw) return null
      const saved = JSON.parse(raw)
      return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : null
    } catch {
      return null
    }
  },
  setItem: (name, value) => {
    try { globalThis.localStorage?.setItem(name, JSON.stringify(value)) } catch { /* Giữ state trong RAM nếu không lưu được. */ }
  },
  removeItem: (name) => {
    try { globalThis.localStorage?.removeItem(name) } catch { /* Storage có thể không khả dụng. */ }
  },
}

const useComparisonStore = create(persist((set, get) => ({
  selectedIds: [],

  addProduct: (productId) => {
    const id = normalizeProductId(productId)
    if (!id) return { success: false, reason: 'invalid_id' }

    // get() đọc lựa chọn mới nhất, kể cả sau các lần thêm/xóa trước đó.
    const { selectedIds } = get()
    if (selectedIds.includes(id)) return { success: false, reason: 'duplicate' }
    if (selectedIds.length >= MAX_COMPARISON_PRODUCTS) return { success: false, reason: 'limit_reached' }

    // Tạo mảng mới thay vì push() trực tiếp vào mảng trong store.
    set({ selectedIds: [...selectedIds, id] })
    return { success: true }
  },

  removeProduct: (productId) => {
    const id = normalizeProductId(productId)
    if (!id) return { success: false, reason: 'invalid_id' }
    if (!get().selectedIds.includes(id)) return { success: true }

    set((state) => ({ selectedIds: state.selectedIds.filter((selectedId) => selectedId !== id) }))
    return { success: true }
  },

  clearComparison: () => {
    set({ selectedIds: [] })
    return { success: true }
  },
}), {
  name: COMPARISON_STORAGE_KEY,
  storage: comparisonStorage,
  partialize: (state) => ({ selectedIds: state.selectedIds }),
  // Chỉ lấy ID đã kiểm tra; không cho dữ liệu lưu ghi đè action hoặc thêm field lạ.
  merge: (persistedState, currentState) => ({
    ...currentState,
    selectedIds: restoreSelectedIds(persistedState?.selectedIds),
  }),
}))

export default useComparisonStore
