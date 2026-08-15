import mongoose from 'mongoose'
import Notification from '../models/Notification.js'
import { emitToUser, emitToAdmins, emitToAll } from '../config/socket.js'
import { AppError } from '../utils/AppError.js'

/**
 * Tạo mới một thông báo, lưu DB và phát Socket.io thời gian thực
 */
export async function createNotification({
  recipient = null,
  recipientRole = 'customer',
  title,
  message,
  type = 'SYSTEM',
  data = {},
}) {
  if (!title || !message) {
    throw new AppError('Tiêu đề và nội dung thông báo là bắt buộc', 400)
  }

  const notification = await Notification.create({
    recipient: recipient ? new mongoose.Types.ObjectId(recipient) : null,
    recipientRole,
    title,
    message,
    type,
    data,
    isRead: false,
  })

  // Phát sự kiện Realtime qua Socket
  const notificationPayload = notification.toObject()

  if (recipient) {
    emitToUser(recipient, 'new_notification', notificationPayload)
  }

  if (recipientRole === 'admin') {
    emitToAdmins('new_notification', notificationPayload)
  } else if (recipientRole === 'all') {
    emitToAll('new_notification', notificationPayload)
  }

  return notification
}

/**
 * Lấy danh sách thông báo của người dùng kèm phân trang và lọc
 */
export async function getUserNotifications(userId, userRole, { page = 1, limit = 20, isRead } = {}) {
  const query = buildUserQuery(userId, userRole)

  if (isRead !== undefined && isRead !== null && isRead !== '') {
    query.isRead = isRead === 'true' || isRead === true
  }

  const safePage = Math.max(1, parseInt(page, 10) || 1)
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20))
  const skip = (safePage - 1) * safeLimit

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Notification.countDocuments(query),
    Notification.countDocuments({ ...buildUserQuery(userId, userRole), isRead: false }),
  ])

  return {
    notifications,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
    unreadCount,
  }
}

/**
 * Đếm số lượng thông báo chưa đọc
 */
export async function getUnreadCount(userId, userRole) {
  const query = {
    ...buildUserQuery(userId, userRole),
    isRead: false,
  }
  return await Notification.countDocuments(query)
}

/**
 * Đánh dấu một thông báo là đã đọc
 */
export async function markAsRead(notificationId, userId, userRole) {
  if (!mongoose.isValidObjectId(notificationId)) {
    throw new AppError('ID thông báo không hợp lệ', 400)
  }

  const query = {
    _id: notificationId,
    ...buildUserQuery(userId, userRole),
  }

  const notification = await Notification.findOneAndUpdate(
    query,
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
      $addToSet: {
        readBy: userId,
      },
    },
    { new: true }
  )

  if (!notification) {
    throw new AppError('Không tìm thấy thông báo hoặc bạn không có quyền', 404)
  }

  return notification
}

/**
 * Đánh dấu tất cả thông báo của người dùng là đã đọc
 */
export async function markAllAsRead(userId, userRole) {
  const query = {
    ...buildUserQuery(userId, userRole),
    isRead: false,
  }

  const result = await Notification.updateMany(query, {
    $set: {
      isRead: true,
      readAt: new Date(),
    },
    $addToSet: {
      readBy: userId,
    },
  })

  return { modifiedCount: result.modifiedCount }
}

/**
 * Hàm phụ trợ xây dựng Query lọc thông báo theo quyền hạn và User
 */
function buildUserQuery(userId, userRole) {
  const userObjId = new mongoose.Types.ObjectId(userId)

  if (userRole === 'admin' || userRole === 'staff') {
    return {
      $or: [
        { recipient: userObjId },
        { recipientRole: 'admin' },
        { recipientRole: 'all' },
      ],
    }
  }

  return {
    $or: [
      { recipient: userObjId },
      { recipientRole: 'all' },
    ],
  }
}
