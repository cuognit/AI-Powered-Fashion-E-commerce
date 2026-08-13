import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import useCartStore from '../store/cartStore.js'

export default function CheckoutRoute({ children }) {
  const items = useCartStore((state) => state.items)
  const isLoading = useCartStore((state) => state.isLoading)
  const hasLoaded = useCartStore((state) => state.hasLoaded)
  const error = useCartStore((state) => state.error)
  const fetchCart = useCartStore((state) => state.fetchCart)

  useEffect(() => {
    if (!hasLoaded && !isLoading) fetchCart().catch(() => {})
  }, [fetchCart, hasLoaded, isLoading])

  if (!hasLoaded && (isLoading || !error)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-3 text-neutral-500">
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
          <span className="text-xs font-bold uppercase tracking-widest">Đang kiểm tra giỏ hàng</span>
        </div>
      </div>
    )
  }

  if (!hasLoaded && error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="max-w-md space-y-4 text-center">
          <h1 className="text-xl font-bold">Không thể kiểm tra giỏ hàng</h1>
          <p className="text-sm text-neutral-600">{error}</p>
          <button
            type="button"
            onClick={() => fetchCart(true).catch(() => {})}
            disabled={isLoading}
            className="bg-black px-5 py-3 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-50"
          >
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  if (items.length === 0) return <Navigate to="/cart" replace />

  return children
}
