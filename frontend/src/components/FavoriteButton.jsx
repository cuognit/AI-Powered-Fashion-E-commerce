import { Heart } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import useAuth from '../hooks/useAuth.js'
import useWishlistStore from '../store/wishlistStore.js'

export const WISHLIST_INTENT_KEY = 'aesthetix:wishlist-intent'

export default function FavoriteButton({ product, className = '', label }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const favoriteIds = useWishlistStore((state) => state.favoriteIds)
  const mutatingIds = useWishlistStore((state) => state.mutatingIds)
  const toggle = useWishlistStore((state) => state.toggle)
  const id = String(product?._id || '')
  const active = favoriteIds.has(id)
  const busy = mutatingIds.has(id)

  const onClick = async (event) => {
    event.preventDefault(); event.stopPropagation()
    if (!isAuthenticated) {
      sessionStorage.setItem(WISHLIST_INTENT_KEY, JSON.stringify({ productId: id, returnTo: `${location.pathname}${location.search}${location.hash}` }))
      toast('Đăng nhập để lưu sản phẩm yêu thích')
      navigate('/login')
      return
    }
    try { await toggle(product); toast.success(active ? 'Đã bỏ khỏi yêu thích' : 'Đã lưu vào yêu thích') }
    catch (error) { toast.error(error.response?.data?.message || 'Không thể cập nhật sản phẩm yêu thích') }
  }

  return <button type='button' onClick={onClick} disabled={busy || !id} aria-pressed={active} aria-label={label || (active ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích')} className={`grid h-9 w-9 cursor-pointer place-items-center bg-white/35 text-black shadow-[0_4px_16px_rgba(0,0,0,0.22)] backdrop-blur-md transition hover:bg-white/55 hover:shadow-[0_7px_20px_rgba(0,0,0,0.28)] disabled:cursor-wait disabled:opacity-50 ${className}`}>
    <Heart className={`h-5 w-5 ${active ? 'fill-black' : 'fill-none'}`} />
  </button>
}
