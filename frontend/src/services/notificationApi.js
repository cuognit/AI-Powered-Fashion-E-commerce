import axiosClient from './axiosClient.js'

export async function fetchNotifications({ page = 1, limit = 20, isRead } = {}) {
  const params = { page, limit }
  if (isRead !== undefined && isRead !== null && isRead !== '') {
    params.isRead = isRead
  }
  const response = await axiosClient.get('/notifications', { params })
  return response.data?.data
}

export async function fetchUnreadNotificationCount() {
  const response = await axiosClient.get('/notifications/unread-count')
  return response.data?.data?.unreadCount || 0
}

export async function markNotificationAsRead(id) {
  const response = await axiosClient.patch(`/notifications/${id}/read`)
  return response.data?.data
}

export async function markAllNotificationsAsRead() {
  const response = await axiosClient.patch('/notifications/read-all')
  return response.data?.data
}
