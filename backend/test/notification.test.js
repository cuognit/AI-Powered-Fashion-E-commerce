import assert from 'node:assert/strict'
import test from 'node:test'
import notificationRoutes from '../src/routes/notification.routes.js'
import * as notificationController from '../src/controllers/notificationController.js'
import Notification from '../src/models/Notification.js'
import * as notificationService from '../src/services/notificationService.js'

const USER_A = '64b000000000000000000001'
const NOTIFICATION_ID = '64b000000000000000000099'

const response = () => ({
  statusCode: 200,
  payload: null,
  status(code) {
    this.statusCode = code
    return this
  },
  json(value) {
    this.payload = value
    return this
  },
})

const nextCapture = () => {
  const errors = []
  return { errors, next: (error) => errors.push(error) }
}

test('notification routes require authentication before all handlers', () => {
  const layers = notificationRoutes.stack
  assert.equal(layers[0].name, 'verifyToken')
  const routeMethods = layers.slice(1).map((layer) => Object.keys(layer.route.methods)[0])
  assert.ok(routeMethods.includes('get'))
  assert.ok(routeMethods.includes('patch'))
})

test('getNotifications returns user notifications list and unread count', async () => {
  const originalFind = Notification.find
  const originalCountDocuments = Notification.countDocuments

  Notification.find = () => ({
    sort: () => ({
      skip: () => ({
        limit: () => ({
          lean: async () => [
            {
              _id: NOTIFICATION_ID,
              recipient: USER_A,
              title: 'Đơn hàng mới',
              message: 'Đơn hàng đã được tạo',
              isRead: false,
              createdAt: new Date(),
            },
          ],
        }),
      }),
    }),
  })

  Notification.countDocuments = async () => 1

  try {
    const res = response()
    const capture = nextCapture()
    await notificationController.getNotifications(
      { user: { sub: USER_A, role: 'customer' }, query: { page: 1, limit: 10 } },
      res,
      capture.next
    )

    assert.equal(capture.errors.length, 0)
    assert.equal(res.payload.status, 'success')
    assert.equal(res.payload.data.notifications.length, 1)
    assert.equal(res.payload.data.unreadCount, 1)
    assert.equal(res.payload.data.pagination.page, 1)
  } finally {
    Notification.find = originalFind
    Notification.countDocuments = originalCountDocuments
  }
})

test('getUnreadCount returns correct unread count', async () => {
  const originalCount = Notification.countDocuments
  Notification.countDocuments = async () => 5

  try {
    const res = response()
    const capture = nextCapture()
    await notificationController.getUnreadCount(
      { user: { sub: USER_A, role: 'customer' } },
      res,
      capture.next
    )

    assert.equal(capture.errors.length, 0)
    assert.equal(res.payload.status, 'success')
    assert.equal(res.payload.data.unreadCount, 5)
  } finally {
    Notification.countDocuments = originalCount
  }
})

test('markAsRead validates ID and updates isRead status', async () => {
  const badCapture = nextCapture()
  await notificationController.markAsRead(
    { user: { sub: USER_A, role: 'customer' }, params: { id: 'invalid-id' } },
    response(),
    badCapture.next
  )
  assert.equal(badCapture.errors[0].statusCode, 400)

  const originalFindOneAndUpdate = Notification.findOneAndUpdate
  Notification.findOneAndUpdate = async (query, update) => ({
    _id: NOTIFICATION_ID,
    isRead: true,
    readAt: update.$set.readAt,
  })

  try {
    const res = response()
    const capture = nextCapture()
    await notificationController.markAsRead(
      { user: { sub: USER_A, role: 'customer' }, params: { id: NOTIFICATION_ID } },
      res,
      capture.next
    )

    assert.equal(capture.errors.length, 0)
    assert.equal(res.payload.status, 'success')
    assert.equal(res.payload.data.isRead, true)
  } finally {
    Notification.findOneAndUpdate = originalFindOneAndUpdate
  }
})

test('markAllAsRead updates all matching unread notifications', async () => {
  const originalUpdateMany = Notification.updateMany
  let executedQuery = null
  Notification.updateMany = async (query) => {
    executedQuery = query
    return { modifiedCount: 3 }
  }

  try {
    const res = response()
    const capture = nextCapture()
    await notificationController.markAllAsRead(
      { user: { sub: USER_A, role: 'customer' } },
      res,
      capture.next
    )

    assert.equal(capture.errors.length, 0)
    assert.equal(res.payload.status, 'success')
    assert.equal(res.payload.data.modifiedCount, 3)
    assert.equal(executedQuery.isRead, false)
  } finally {
    Notification.updateMany = originalUpdateMany
  }
})
