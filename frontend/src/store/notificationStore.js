import { create } from 'zustand'
import toast from 'react-hot-toast'
import * as notificationApi from '../services/notificationApi.js'
import { playNotificationSound } from '../utils/notificationSound.js'

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  loadingMore: false,
  page: 1,
  totalPages: 1,
  hasMore: false,
  filter: 'all', // 'all' | 'unread'
  isDrawerOpen: false,

  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),

  setFilter: async (filter) => {
    set({ filter, page: 1 })
    await get().fetchNotifications({ page: 1, filter })
  },

  fetchNotifications: async ({ page = 1, filter = get().filter } = {}) => {
    const isRead = filter === 'unread' ? false : undefined
    set({ loading: page === 1, loadingMore: page > 1 })
    try {
      const data = await notificationApi.fetchNotifications({ page, limit: 15, isRead })
      if (!data) return

      set({
        notifications: page === 1 ? data.notifications : [...get().notifications, ...data.notifications],
        unreadCount: data.unreadCount ?? get().unreadCount,
        page: data.pagination.page,
        totalPages: data.pagination.totalPages,
        hasMore: data.pagination.page < data.pagination.totalPages,
        loading: false,
        loadingMore: false,
      })
    } catch (error) {
      // console.warn('Lỗi tải danh sách thông báo:', error)
      set({ loading: false, loadingMore: false })
    }
  },

  fetchUnreadCount: async () => {
    try {
      const unreadCount = await notificationApi.fetchUnreadNotificationCount()
      set({ unreadCount })
    } catch {
      // Silently catch error
    }
  },

  markAsRead: async (notificationId) => {
    // Optimistic UI update
    const previousNotifications = get().notifications
    const target = previousNotifications.find((n) => n._id === notificationId)
    const wasUnread = target && !target.isRead

    set((state) => ({
      notifications: state.notifications.map((item) =>
        item._id === notificationId ? { ...item, isRead: true, readAt: new Date() } : item
      ),
      unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
    }))

    try {
      await notificationApi.markNotificationAsRead(notificationId)
    } catch {
      // Revert if API fails
      set({ notifications: previousNotifications })
    }
  },

  markAllAsRead: async () => {
    const previousNotifications = get().notifications
    const previousUnread = get().unreadCount

    // Optimistic update
    set((state) => ({
      notifications: state.notifications.map((item) => ({
        ...item,
        isRead: true,
        readAt: new Date(),
      })),
      unreadCount: 0,
    }))

    try {
      await notificationApi.markAllNotificationsAsRead()
      toast.success('Đã đánh dấu tất cả thông báo là đã đọc')
    } catch {
      // Revert on error
      set({ notifications: previousNotifications, unreadCount: previousUnread })
      toast.error('Không thể cập nhật trạng thái thông báo')
    }
  },

  handleIncomingNotification: (notification) => {
    if (!notification || !notification._id) return

    // Âm thanh chuông báo
    playNotificationSound()

    // Toast popup thông báo nhanh
    toast(`${notification.title}\n${notification.message}`, {
      icon: '🔔',
      duration: 5000,
      style: {
        borderRadius: '12px',
        background: '#111111',
        color: '#ffffff',
        fontSize: '12px',
        fontWeight: '600',
        lineHeight: '1.5',
        padding: '12px 16px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
      },
    })

    // Cập nhật state
    set((state) => {
      const exists = state.notifications.some((n) => n._id === notification._id)
      if (exists) return state

      return {
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      }
    })
  },

  reset: () => {
    set({
      notifications: [],
      unreadCount: 0,
      loading: false,
      loadingMore: false,
      page: 1,
      totalPages: 1,
      hasMore: false,
      isDrawerOpen: false,
    })
  },
}))

export default useNotificationStore
