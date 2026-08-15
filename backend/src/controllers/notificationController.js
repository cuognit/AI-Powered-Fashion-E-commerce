import * as notificationService from '../services/notificationService.js'

export async function getNotifications(req, res, next) {
  try {
    const result = await notificationService.getUserNotifications(
      req.user.sub,
      req.user.role,
      req.query
    )
    res.status(200).json({
      status: 'success',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function getUnreadCount(req, res, next) {
  try {
    const unreadCount = await notificationService.getUnreadCount(
      req.user.sub,
      req.user.role
    )
    res.status(200).json({
      status: 'success',
      data: { unreadCount },
    })
  } catch (error) {
    next(error)
  }
}

export async function markAsRead(req, res, next) {
  try {
    const notification = await notificationService.markAsRead(
      req.params.id,
      req.user.sub,
      req.user.role
    )
    res.status(200).json({
      status: 'success',
      data: notification,
    })
  } catch (error) {
    next(error)
  }
}

export async function markAllAsRead(req, res, next) {
  try {
    const result = await notificationService.markAllAsRead(
      req.user.sub,
      req.user.role
    )
    res.status(200).json({
      status: 'success',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}
