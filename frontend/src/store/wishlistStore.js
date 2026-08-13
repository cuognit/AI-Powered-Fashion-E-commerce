import { create } from 'zustand'
import { addWishlistItem, getWishlist, removeWishlistItem } from '../services/wishlistApi.js'

const idsOf = (items) => new Set(items.map((item) => String(item._id)))

const useWishlistStore = create((set, get) => ({
  items: [],
  favoriteIds: new Set(),
  isLoading: false,
  error: '',
  mutatingIds: new Set(),

  fetch: async () => {
    set({ isLoading: true, error: '' })
    try {
      const { data } = await getWishlist()
      const items = data.items || []
      set({ items, favoriteIds: idsOf(items), isLoading: false })
      return items
    } catch (error) {
      set({ isLoading: false, error: error.response?.data?.message || 'Không thể tải sản phẩm yêu thích.' })
      throw error
    }
  },

  add: async (product) => {
    const id = String(product?._id || product)
    if (get().favoriteIds.has(id)) return
    const previousItems = get().items
    const optimistic = typeof product === 'object' ? { ...product, favoritedAt: new Date().toISOString() } : null
    set((state) => ({
      items: optimistic ? [optimistic, ...state.items.filter((item) => String(item._id) !== id)] : state.items,
      favoriteIds: new Set(state.favoriteIds).add(id),
      mutatingIds: new Set(state.mutatingIds).add(id),
    }))
    try {
      const { data } = await addWishlistItem(id)
      set((state) => ({ items: [data.item, ...state.items.filter((item) => String(item._id) !== id)] }))
    } catch (error) {
      set({ items: previousItems, favoriteIds: idsOf(previousItems) })
      throw error
    } finally {
      set((state) => { const next = new Set(state.mutatingIds); next.delete(id); return { mutatingIds: next } })
    }
  },

  remove: async (productId) => {
    const id = String(productId)
    const previousItems = get().items
    const wasFavorite = get().favoriteIds.has(id)
    set((state) => { const favoriteIds = new Set(state.favoriteIds); favoriteIds.delete(id); return { items: state.items.filter((item) => String(item._id) !== id), favoriteIds, mutatingIds: new Set(state.mutatingIds).add(id) } })
    try { await removeWishlistItem(id) }
    catch (error) {
      set({ items: previousItems, favoriteIds: wasFavorite ? idsOf(previousItems) : get().favoriteIds })
      throw error
    } finally {
      set((state) => { const next = new Set(state.mutatingIds); next.delete(id); return { mutatingIds: next } })
    }
  },

  toggle: (product) => get().favoriteIds.has(String(product._id)) ? get().remove(product._id) : get().add(product),
  reset: () => set({ items: [], favoriteIds: new Set(), isLoading: false, error: '', mutatingIds: new Set() }),
}))

export default useWishlistStore
