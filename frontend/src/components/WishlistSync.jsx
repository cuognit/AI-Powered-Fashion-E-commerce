import { useEffect } from 'react'
import useAuth from '../hooks/useAuth.js'
import useWishlistStore from '../store/wishlistStore.js'

export default function WishlistSync() {
  const { isAuthenticated } = useAuth()
  const fetchWishlist = useWishlistStore((state) => state.fetch)
  const reset = useWishlistStore((state) => state.reset)
  useEffect(() => {
    if (isAuthenticated) fetchWishlist().catch(() => {})
    else reset()
  }, [isAuthenticated, fetchWishlist, reset])
  return null
}
