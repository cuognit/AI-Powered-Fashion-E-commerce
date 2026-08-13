import { create } from 'zustand'
import axiosClient from '../services/axiosClient.js'

const messageOf = (error) => error.response?.data?.message || 'Không thể cập nhật giỏ hàng'

const useCartStore = create((set, get) => ({
  items: [], isLoading: false, isMutating: false, error: null, hasLoaded: false,
  shippingCost: 25000, aiInsuranceCost: 0, appliedCoupon: null, discountPercent: 0,
  paymentMethod: 'vnpay',
  shippingDetails: { fullName: '', phone: '', address: '', city: '', postalCode: '', notes: '' },
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setShippingDetails: (field, value) => set((state) => ({ shippingDetails: { ...state.shippingDetails, [field]: value } })),
  resetCart: () => set({ items: [], hasLoaded: false, error: null }),
  fetchCart: async (force = false) => {
    if (get().isLoading || (get().hasLoaded && !force)) return
    set({ isLoading: true, error: null })
    try {
      const { data } = await axiosClient.get('/cart')
      set({ items: data.items || [], hasLoaded: true })
    } catch (error) { set({ error: messageOf(error) }); throw error }
    finally { set({ isLoading: false }) }
  },
  addItem: async (productId, variantSku, quantity) => {
    set({ isMutating: true, error: null })
    try {
      const { data } = await axiosClient.post('/cart/items', { productId, variantSku, quantity })
      set({ items: data.items || [], hasLoaded: true })
    } catch (error) { set({ error: messageOf(error) }); throw error }
    finally { set({ isMutating: false }) }
  },
  updateQuantity: async (id, quantity) => {
    const previous = get().items
    const item = previous.find((entry) => entry.id === id)
    if (!item) return
    set({ items: previous.map((entry) => entry.id === id ? { ...entry, quantity } : entry), isMutating: true })
    try {
      const { data } = await axiosClient.patch(`/cart/items/${encodeURIComponent(item.variantSku)}`, { quantity })
      set({ items: data.items || [] })
    } catch (error) { set({ items: previous, error: messageOf(error) }); throw error }
    finally { set({ isMutating: false }) }
  },
  removeItem: async (id) => {
    const previous = get().items
    const item = previous.find((entry) => entry.id === id)
    if (!item) return
    set({ items: previous.filter((entry) => entry.id !== id), isMutating: true })
    try {
      const { data } = await axiosClient.delete(`/cart/items/${encodeURIComponent(item.variantSku)}`)
      set({ items: data.items || [] })
    } catch (error) { set({ items: previous, error: messageOf(error) }); throw error }
    finally { set({ isMutating: false }) }
  },
  clearCart: async () => {
    const { data } = await axiosClient.delete('/cart')
    set({ items: data.items || [], appliedCoupon: null, discountPercent: 0 })
  },
  applyCoupon: (code) => {
    const formatted = code.trim().toUpperCase()
    const percent = formatted === 'VIP20' ? 20 : ['AESTHETIX10', 'AEST10'].includes(formatted) ? 10 : 0
    if (!percent) return { success: false, message: 'Mã giảm giá không hợp lệ. Hãy thử "AESTHETIX10"' }
    set({ appliedCoupon: formatted, discountPercent: percent })
    return { success: true, message: `Đã áp dụng giảm giá ${percent}%` }
  },
  removeCoupon: () => set({ appliedCoupon: null, discountPercent: 0 }),
  getSubtotal: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  getDiscountAmount: () => get().getSubtotal() * get().discountPercent / 100,
  getTotal: () => get().items.length ? get().getSubtotal() - get().getDiscountAmount() + get().shippingCost + get().aiInsuranceCost : 0,
}))

export default useCartStore
