import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight, Heart, History, LogOut, ShieldCheck, ShoppingBag, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import useAuth from '../hooks/useAuth.js'
import useCartStore from '../store/cartStore.js'
import useWishlistStore from '../store/wishlistStore.js'

export default function UserDropdown({ isOpen, onClose }) {
  const { user, logout } = useAuth()
  const items = useCartStore((state) => state.items)
  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const wishlistCount = useWishlistStore((state) => state.items.length)
  const isAdmin = user?.role === 'admin'

  const handleLogout = async () => {
    await logout()
    toast.success('Đăng xuất thành công')
    onClose?.()
  }

  const menuItems = [
    ...(isAdmin ? [{ label: 'Trang quản trị', path: '/admin', icon: ShieldCheck, badge: 'QUẢN TRỊ' }] : []),
    { label: 'Hồ sơ của tôi', path: '/profile', icon: User },
    { label: 'Đơn hàng của tôi', path: '/orders', icon: History },
    { label: 'Sản phẩm yêu thích', path: '/wishlist', icon: Heart, countBadge: wishlistCount || null },
    { label: 'Giỏ hàng', path: '/cart', icon: ShoppingBag, countBadge: cartItemCount || null },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-gray-100 bg-white/98 text-gray-800 shadow-xl backdrop-blur-md before:absolute before:-top-4 before:left-0 before:right-0 before:h-4 before:bg-transparent"
          onMouseLeave={onClose}
        >
          {/* Invisible Hover Bridge / Buffer Zone */}
          <div className="absolute -top-5 left-0 right-0 h-4 bg-transparent" />

          <div className="border-b border-gray-100 bg-gray-50/80 p-4 rounded-t-2xl">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-xs font-bold uppercase tracking-wider text-black">
                {user?.name || (isAdmin ? 'Quản trị viên' : 'Thành viên AESTHETIX')}
              </p>
              {isAdmin && <span className="rounded-md bg-black px-2 py-0.5 font-mono text-[9px] font-bold tracking-wider text-white">ADMIN</span>}
            </div>
            <p className="mt-0.5 truncate text-[11px] text-gray-500">{user?.email || 'Member account'}</p>
          </div>

          <div className="space-y-0.5 px-1.5 py-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.path} to={item.path} onClick={onClose} className="group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100/80 hover:text-black">
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 shrink-0 text-gray-500 transition group-hover:text-black" />
                    {item.label}
                  </span>
                  <span className="flex items-center gap-1.5">
                    {item.badge && <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[9px] font-bold text-purple-700">{item.badge}</span>}
                    {item.countBadge && <span className="rounded-full bg-black px-1.5 text-[10px] font-bold text-white">{item.countBadge}</span>}
                    <ChevronRight className="h-3.5 w-3.5 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-black" />
                  </span>
                </Link>
              )
            })}

            <div className="my-1 border-t border-gray-100" />
            <button type="button" onClick={handleLogout} className="group flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-50">
              <LogOut className="h-4 w-4 shrink-0 text-red-500 transition group-hover:scale-110" />
              Đăng xuất
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
