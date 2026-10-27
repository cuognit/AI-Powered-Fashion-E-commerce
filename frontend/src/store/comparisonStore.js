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

    const { selectedIds } = get()
    if (selectedIds.includes(id)) return { success: false, reason: 'duplicate' }
    if (selectedIds.length >= MAX_COMPARISON_PRODUCTS) return { success: false, reason: 'limit_reached' }

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
  merge: (persistedState, currentState) => ({
    ...currentState,
    selectedIds: restoreSelectedIds(persistedState?.selectedIds),
  }),
}))

export default useComparisonStore
