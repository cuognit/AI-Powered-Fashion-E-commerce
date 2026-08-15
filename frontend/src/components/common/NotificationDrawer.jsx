import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  X,
  Bell,
  CheckCheck,
  Package,
  Truck,
  CreditCard,
  AlertCircle,
  Clock,
  Sparkles,
  Search,
  Filter,
  ArrowRight,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import useNotificationStore from '../../store/notificationStore.js'

function formatRelativeTime(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now - date) / 1000)

  if (diffInSeconds < 60) return 'Vừa xong'
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) return `${diffInMinutes} phút trước`
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours} giờ trước`
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) return `${diffInDays} ngày trước`
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function getNotificationIcon(type) {
  switch (type) {
    case 'ORDER_CREATED':
      return <Package className="h-5 w-5 text-emerald-600" />
    case 'ORDER_STATUS_UPDATED':
      return <Truck className="h-5 w-5 text-blue-600" />
    case 'PAYMENT_SUCCESS':
      return <CreditCard className="h-5 w-5 text-emerald-600" />
    case 'PAYMENT_FAILED':
      return <AlertCircle className="h-5 w-5 text-rose-600" />
    case 'PROMOTION':
      return <Sparkles className="h-5 w-5 text-amber-500" />
    default:
      return <Bell className="h-5 w-5 text-neutral-600" />
  }
}

export default function NotificationDrawer({ isAdmin = false }) {
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  const {
    notifications,
    unreadCount,
    loading,
    loadingMore,
    hasMore,
    page,
    filter,
    isDrawerOpen,
    closeDrawer,
    setFilter,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore()

  const handleCardClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id)
    }
    closeDrawer()
    let targetUrl = notification.data?.url
    if (!targetUrl) {
      if (isAdmin) {
        targetUrl = notification.data?.orderCode
          ? `/admin/orders?code=${encodeURIComponent(notification.data.orderCode)}`
          : '/admin/orders'
      } else {
        targetUrl = '/orders'
      }
    } else if (isAdmin && notification.data?.orderCode && !targetUrl.includes('code=')) {
      targetUrl = `/admin/orders?code=${encodeURIComponent(notification.data.orderCode)}`
    }
    navigate(targetUrl)
  }

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchNotifications({ page: page + 1, filter })
    }
  }

  // Lọc thông báo theo từ khóa tìm kiếm (Search Query)
  const filteredNotifications = notifications.filter((item) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      item.title?.toLowerCase().includes(q) ||
      item.message?.toLowerCase().includes(q) ||
      item.data?.orderCode?.toLowerCase().includes(q)
    )
  })

  const drawerContent = (
    <AnimatePresence>
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[9999] flex justify-end">
          {/* Backdrop mờ nền */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />

          {/* Khung Drawer trượt từ phải sang */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative z-10 flex h-full w-full max-w-lg flex-col bg-white shadow-2xl text-neutral-900 border-l border-neutral-200"
          >
            {/* Header Drawer */}
            <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-5 bg-neutral-50">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-black text-white shadow-md">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-black uppercase tracking-tight">Hộp Thoại Thông Báo</h2>
                  <p className="text-xs text-neutral-500 font-medium">
                    {unreadCount > 0
                      ? `Bạn có ${unreadCount} thông báo chưa đọc`
                      : 'Bạn đã đọc hết tất cả thông báo'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeDrawer}
                className="grid h-9 w-9 place-items-center rounded-full text-neutral-400 hover:bg-neutral-200 hover:text-black transition cursor-pointer"
                aria-label="Đóng hộp thoại"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Bộ lọc Tabs & Công cụ tìm kiếm */}
            <div className="border-b border-neutral-200 p-4 space-y-3 bg-white">
              <div className="flex items-center justify-between gap-2">
                {/* Tabs Tất cả / Chưa đọc */}
                <div className="inline-flex rounded-xl bg-neutral-100 p-1">
                  <button
                    type="button"
                    onClick={() => setFilter('all')}
                    className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                      filter === 'all'
                        ? 'bg-white text-black shadow-xs'
                        : 'text-neutral-500 hover:text-black'
                    }`}
                  >
                    Tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter('unread')}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                      filter === 'unread'
                        ? 'bg-white text-black shadow-xs'
                        : 'text-neutral-500 hover:text-black'
                    }`}
                  >
                    <span>Chưa đọc</span>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-rose-600 px-1.5 py-0.2 text-[10px] font-bold text-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* Nút Đánh dấu tất cả đã đọc */}
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-600 hover:text-black transition py-1 px-2.5 rounded-lg hover:bg-neutral-100 cursor-pointer"
                  >
                    <CheckCheck className="h-4 w-4 text-emerald-600" />
                    <span>Đọc tất cả</span>
                  </button>
                )}
              </div>

              {/* Ô tìm kiếm nhanh */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm nội dung thông báo, mã đơn..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-9 pr-4 py-2 text-xs text-neutral-800 placeholder-neutral-400 focus:bg-white focus:border-black focus:outline-none transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400 hover:text-black cursor-pointer"
                  >
                    Xóa
                  </button>
                )}
              </div>
            </div>

            {/* Danh sách thông báo đầy đủ */}
            <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 p-2 space-y-1 overscroll-contain">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <span className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
                  <p className="text-xs font-semibold text-neutral-500">Đang tải lịch sử thông báo...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
                  <div className="grid h-16 w-16 place-items-center rounded-full bg-neutral-100 text-neutral-400 mb-4">
                    <Bell className="h-8 w-8" />
                  </div>
                  <h4 className="text-sm font-black text-neutral-800">Không tìm thấy thông báo nào</h4>
                  <p className="text-xs text-neutral-500 mt-1 max-w-xs leading-relaxed">
                    {searchQuery
                      ? 'Không có thông báo nào phù hợp với từ khóa tìm kiếm.'
                      : filter === 'unread'
                      ? 'Tuyệt vời! Bạn không còn thông báo chưa đọc nào.'
                      : 'Hệ thống chưa có thông báo nào dành cho bạn.'}
                  </p>
                </div>
              ) : (
                filteredNotifications.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => handleCardClick(item)}
                    className={`cursor-pointer rounded-xl p-4 flex gap-3.5 transition-all relative border ${
                      item.isRead
                        ? 'bg-white border-transparent hover:border-neutral-200 hover:bg-neutral-50/70'
                        : 'bg-blue-50/40 border-blue-100 hover:bg-blue-50/70 shadow-xs'
                    }`}
                  >
                    {/* Icon phân loại */}
                    <div
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition ${
                        item.isRead
                          ? 'bg-neutral-100 text-neutral-500'
                          : 'bg-white shadow-xs ring-1 ring-black/5 text-black'
                      }`}
                    >
                      {getNotificationIcon(item.type)}
                    </div>

                    {/* Chi tiết nội dung */}
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-start justify-between gap-2">
                        <h4
                          className={`text-xs ${
                            item.isRead ? 'font-bold text-neutral-800' : 'font-black text-black'
                          }`}
                        >
                          {item.title}
                        </h4>
                        <span className="shrink-0 text-[11px] text-neutral-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>

                      <p
                        className={`mt-1 text-xs leading-relaxed ${
                          item.isRead ? 'text-neutral-600' : 'text-neutral-800 font-medium'
                        }`}
                      >
                        {item.message}
                      </p>

                      {/* Nút xem chi tiết */}
                      <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-neutral-900 group-hover:text-black">
                        <span>Xem chi tiết</span>
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>

                    {/* Dấu chấm xanh Chưa đọc (Cân giữa trên dưới) */}
                    {!item.isRead && (
                      <span className="absolute top-1/2 -translate-y-1/2 right-3.5 h-2.5 w-2.5 rounded-full bg-blue-600 shadow-xs" />
                    )}
                  </div>
                ))
              )}

              {/* Nút Tải thêm */}
              {hasMore && (
                <div className="p-4 text-center">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="w-full py-2.5 rounded-xl border border-neutral-300 bg-white text-xs font-bold hover:border-black hover:bg-neutral-50 transition disabled:opacity-50 cursor-pointer"
                  >
                    {loadingMore ? 'Đang tải thêm...' : 'Tải thêm thông báo cũ hơn'}
                  </button>
                </div>
              )}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  )

  return typeof document !== 'undefined' ? createPortal(drawerContent, document.body) : null
}
