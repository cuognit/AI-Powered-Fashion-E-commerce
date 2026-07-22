import { create } from 'zustand'

const initialItems = [
  {
    id: 'cyber-blazer-01',
    name: 'CYBER-TAILORED BLAZER',
    size: 'L',
    color: 'ONYX',
    price: 590.0,
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=400&auto=format&fit=crop',
  },
  {
    id: 'neural-hoodie-02',
    name: 'NEURAL-KNIT HOODIE',
    size: 'M',
    color: 'CHALK',
    price: 245.0,
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=400&auto=format&fit=crop',
  },
  {
    id: 'trench-coat-03',
    name: 'ARCHITECTURAL TRENCH COAT',
    size: 'XL',
    color: 'SLATE',
    price: 720.0,
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=400&auto=format&fit=crop',
  },
  {
    id: 'knit-cardigan-04',
    name: 'ZERO-G KNIT CARDIGAN',
    size: 'S',
    color: 'IVORY',
    price: 310.0,
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=400&auto=format&fit=crop',
  },
  {
    id: 'raw-denim-05',
    name: 'ASYMMETRIC RAW DENIM',
    size: '32',
    color: 'INDIGO',
    price: 280.0,
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=400&auto=format&fit=crop',
  },
]

const useCartStore = create((set, get) => ({
  items: initialItems,
  shippingCost: 25.0,
  aiInsuranceCost: 0.0,
  appliedCoupon: null,
  discountPercent: 0,
  paymentMethod: 'qr', // 'cod' | 'qr' | 'card'

  shippingDetails: {
    fullName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    notes: '',
  },

  setPaymentMethod: (method) => set({ paymentMethod: method }),

  setShippingDetails: (field, value) =>
    set((state) => ({
      shippingDetails: { ...state.shippingDetails, [field]: value },
    })),

  applyCoupon: (code) => {
    const formatted = code.trim().toUpperCase()
    if (formatted === 'AESTHETIX10' || formatted === 'AEST10') {
      set({ appliedCoupon: formatted, discountPercent: 10 })
      return { success: true, message: 'Applied 10% AESTHETIX VIP discount!' }
    } else if (formatted === 'VIP20') {
      set({ appliedCoupon: formatted, discountPercent: 20 })
      return { success: true, message: 'Applied 20% Special Member discount!' }
    } else {
      return { success: false, message: 'Invalid coupon code. Try "AESTHETIX10"' }
    }
  },

  removeCoupon: () => set({ appliedCoupon: null, discountPercent: 0 }),

  updateQuantity: (id, delta) =>
    set((state) => ({
      items: state.items
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta
            return newQty > 0 ? { ...item, quantity: newQty } : null
          }
          return item
        })
        .filter(Boolean),
    })),

  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),

  clearCart: () => set({ items: [], appliedCoupon: null, discountPercent: 0 }),

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  },

  getDiscountAmount: () => {
    const sub = get().getSubtotal()
    const pct = get().discountPercent
    return (sub * pct) / 100
  },

  getTotal: () => {
    const sub = get().getSubtotal()
    if (sub === 0) return 0
    const disc = get().getDiscountAmount()
    return sub - disc + get().shippingCost + get().aiInsuranceCost
  },
}))

export default useCartStore
