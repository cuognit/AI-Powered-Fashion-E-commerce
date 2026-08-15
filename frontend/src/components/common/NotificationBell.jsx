import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bell,
  CheckCheck,
  Maximize2,
  Package,
  Truck,
  CreditCard,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronRight,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import useAuth from '../../hooks/useAuth.js'
import useNotificationStore from '../../store/notificationStore.js'
import { connectSocket, getSocket } from '../../services/socket.js'
import NotificationDrawer from './NotificationDrawer.jsx'

/**
 * Định dạng thời gian tương đối
 */
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
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/**
 * Chọn Icon theo loại thông báo
 */
function getNotificationIcon(type) {
  switch (type) {
    case 'ORDER_CREATED':
      return <Package className="h-4 w-4 text-emerald-600" />
    case 'ORDER_STATUS_UPDATED':
      return <Truck className="h-4 w-4 text-blue-600" />
    case 'PAYMENT_SUCCESS':
      return <CreditCard className="h-4 w-4 text-emerald-600" />
    case 'PAYMENT_FAILED':
      return <AlertCircle className="h-4 w-4 text-rose-600" />
    case 'PROMOTION':
      return <Sparkles className="h-4 w-4 text-amber-500" />
    default:
      return <Bell className="h-4 w-4 text-neutral-600" />
  }
}

export default function NotificationBell({ isAdmin = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  const { isAuthenticated, accessToken, user } = useAuth()
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    handleIncomingNotification,
    openDrawer,
    reset,
  } = useNotificationStore()

  // Kết nối Socket và lắng nghe sự kiện khi đăng nhập
  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      reset()
      return
    }

    fetchUnreadCount()
    fetchNotifications({ page: 1 })

    const socket = connectSocket(accessToken)

    const onNewNotification = (notification) => {
      handleIncomingNotification(notification)
    }

    socket.on('new_notification', onNewNotification)

    return () => {
      socket.off('new_notification', onNewNotification)
    }
  }, [isAuthenticated, accessToken, user?.id, handleIncomingNotification, fetchNotifications, fetchUnreadCount, reset])

  // Đóng Popover khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Xử lý khi bấm vào 1 thẻ thông báo
  const handleCardClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id)
    }
    setIsOpen(false)

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

  if (!isAuthenticated) {
    return null
  }

  const recentNotifications = notifications.slice(0, 5)

  return (
    <>
      <div className="relative inline-block" ref={dropdownRef}>
        {/* Nút Chuông Thông Báo */}
        <button
          type="button"
          onClick={() => {
            if (!isOpen) {
              fetchNotifications({ page: 1 })
            }
            setIsOpen(!isOpen)
          }}
          className={`relative grid h-10 w-10 place-items-center transition-all rounded-full ${
            isAdmin
              ? 'border border-neutral-300 bg-white text-black hover:border-black'
              : 'text-gray-700 hover:text-black hover:bg-black/5'
          } ${isOpen ? 'ring-2 ring-black/10' : ''}`}
          aria-label="Thông báo"
          title="Thông báo"
        >
          <Bell className="h-5 w-5" />

          {/* Chấm đỏ / Badge số lượng chưa đọc */}
          {unreadCount > 0 && (
            <span
              className={`absolute -top-1 -right-1 flex items-center justify-center font-bold text-white shadow-sm transition-transform animate-in zoom-in-50 duration-200 ${
                unreadCount > 9
                  ? 'h-5 px-1.5 text-[10px] rounded-full bg-rose-600'
                  : 'h-4.5 w-4.5 text-[10px] rounded-full bg-rose-600'
              }`}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Hộp Thoại Dropdown Popover */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 z-50 overflow-hidden flex flex-col ${
                isAdmin ? 'text-neutral-900' : 'text-neutral-900'
              }`}
            >
              {/* Header của Hộp thoại */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-100 bg-neutral-50/80 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black tracking-tight uppercase">Thông báo</h3>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                      {unreadCount} mới
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {/* Nút Đánh dấu tất cả đã đọc */}
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => markAllAsRead()}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-neutral-600 hover:bg-neutral-200/60 hover:text-black transition"
                      title="Đánh dấu tất cả đã đọc"
                    >
                      <CheckCheck className="h-3.5 w-3.5 text-neutral-500" />
                      <span className="hidden sm:inline">Đã đọc tất cả</span>
                    </button>
                  )}

                  {/* Nút Mở rộng hộp thoại */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false)
                      openDrawer()
                    }}
                    className="grid h-7 w-7 place-items-center rounded-lg text-neutral-500 hover:bg-neutral-200/60 hover:text-black transition"
                    title="Mở rộng hộp thoại thông báo"
                    aria-label="Mở rộng"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Danh sách Thông báo */}
              <div className="max-h-[380px] overflow-y-auto divide-y divide-neutral-100 overscroll-contain">
                {loading && recentNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <span className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
                    <p className="text-[11px] font-medium text-neutral-500">Đang tải thông báo...</p>
                  </div>
                ) : recentNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-neutral-100 text-neutral-400 mb-3">
                      <Bell className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-bold text-neutral-700">Chưa có thông báo nào</p>
                    <p className="text-[11px] text-neutral-400 mt-1 max-w-[200px]">
                      Các cập nhật về đơn hàng và ưu đãi sẽ xuất hiện tại đây.
                    </p>
                  </div>
                ) : (
                  recentNotifications.map((item) => (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => handleCardClick(item)}
                      className={`w-full text-left p-3.5 flex gap-3 transition-colors relative group ${
                        item.isRead
                          ? 'bg-white hover:bg-neutral-50'
                          : 'bg-blue-50/40 hover:bg-blue-50/70'
                      }`}
                    >
                      {/* Icon phân loại */}
                      <div
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl transition ${
                          item.isRead
                            ? 'bg-neutral-100 text-neutral-500'
                            : 'bg-white shadow-sm ring-1 ring-black/5 text-black'
                        }`}
                      >
                        {getNotificationIcon(item.type)}
                      </div>

                      {/* Nội dung thông báo */}
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="flex items-start justify-between gap-1">
                          <p
                            className={`text-xs truncate ${
                              item.isRead ? 'font-semibold text-neutral-800' : 'font-black text-black'
                            }`}
                          >
                            {item.title}
                          </p>
                          <span className="shrink-0 text-[10px] text-neutral-400 flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            {formatRelativeTime(item.createdAt)}
                          </span>
                        </div>

                        <p
                          className={`mt-0.5 text-xs line-clamp-2 leading-relaxed ${
                            item.isRead ? 'text-neutral-500' : 'text-neutral-700'
                          }`}
                        >
                          {item.message}
                        </p>
                      </div>

                      {/* Chấm xanh biểu thị Chưa đọc (Cân giữa trên dưới) */}
                      {!item.isRead && (
                        <span className="absolute top-1/2 -translate-y-1/2 right-3 h-2 w-2 rounded-full bg-blue-600 shadow-xs" />
                      )}
                    </button>
                  ))
                )}
              </div>

              {/* Footer của Hộp thoại: Nút Xem tất cả */}
              <div className="border-t border-neutral-100 bg-neutral-50/50 p-2.5 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false)
                    openDrawer()
                  }}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold text-neutral-800 hover:text-black hover:bg-neutral-200/50 rounded-lg transition"
                >
                  <span>Xem tất cả lịch sử thông báo</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Drawer Mở Rộng Toàn Diện */}
      <NotificationDrawer isAdmin={isAdmin} />
    </>
  )
}
