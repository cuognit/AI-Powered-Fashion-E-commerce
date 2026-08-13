import mongoose from 'mongoose'
import Cart from '../models/Cart.js'
import Order from '../models/Order.js'
import Product from '../models/product.model.js'
import '../models/User.js'
import { AppError } from '../utils/AppError.js'
import { getCart } from './cartService.js'
import { allocateReorderQuantity, allowedAdminTransitions, escapeRegex, ORDER_STATUSES, legacyStatusHistory } from '../utils/order.js'

const PAYMENT_STATUSES = ['pending_payment', 'payment_review', 'paid', 'failed', 'expired', 'cod_pending']

function paginationOf(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1)
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 10))
  return { page, limit, skip: (page - 1) * limit }
}

function validateListQuery(query, { admin = false } = {}) {
  if (query.status && !ORDER_STATUSES.includes(query.status)) throw new AppError('Trạng thái đơn hàng không hợp lệ', 400)
  if (admin && query.paymentStatus && !PAYMENT_STATUSES.includes(query.paymentStatus)) throw new AppError('Trạng thái thanh toán không hợp lệ', 400)
  if (query.search && String(query.search).trim().length > 100) throw new AppError('Từ khóa tìm kiếm quá dài', 400)
}

function appendEvent(order, event, actorType, actorId, note = '', occurredAt = new Date()) {
  if (!Array.isArray(order.status_history)) order.status_history = []
  order.status_history.push({ event, actor_type: actorType, actor_id: actorId, note, occurred_at: occurredAt })
}

function serializeItem(item) {
  const product = item.product_id && typeof item.product_id === 'object' ? item.product_id : null
  return {
    productId: String(product?._id || item.product_id || ''),
    name: item.product_name,
    image: item.image_url || product?.images?.[0] || '',
    variantSku: item.variant_sku,
    color: item.color,
    size: item.size,
    quantity: item.quantity,
    price: item.price,
  }
}

function serializeHistory(order) {
  return legacyStatusHistory(order)
    .map((entry) => ({
      event: entry.event,
      occurredAt: entry.occurred_at,
      actorType: entry.actor_type,
      note: entry.note || '',
    }))
    .sort((a, b) => new Date(a.occurredAt) - new Date(b.occurredAt))
}

function serializeOrder(order, { detail = false, admin = false } = {}) {
  const items = (order.items || []).map(serializeItem)
  const result = {
    orderCode: order.order_code,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    totalAmount: order.total_amount,
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status,
    status: order.status,
    expiresAt: order.payment_expires_at,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    items,
    shipment: {
      carrier: order.shipment?.carrier || '',
      trackingCode: order.shipment?.tracking_code || '',
      estimatedDeliveryAt: order.shipment?.estimated_delivery_at || null,
      shippedAt: order.shipment?.shipped_at || null,
      deliveredAt: order.shipment?.delivered_at || null,
    },
    refund: {
      status: order.refund?.status || 'none',
      requestedAt: order.refund?.requested_at || null,
      completedAt: order.refund?.completed_at || null,
      reference: order.refund?.reference || '',
      note: order.refund?.note || '',
    },
  }

  if (detail || admin) {
    Object.assign(result, {
      shippingAddress: order.shipping_address,
      phoneNumber: order.phone_number,
      note: order.note || '',
      statusHistory: serializeHistory(order),
      cancellation: {
        reasonCode: order.cancellation?.reason_code || order.cancel_reason || null,
        note: order.cancellation?.note || '',
        canceledAt: order.cancellation?.canceled_at || null,
      },
    })
  }

  if (admin) {
    result.customer = order.user_id && typeof order.user_id === 'object'
      ? { id: String(order.user_id._id), name: order.user_id.name, email: order.user_id.email }
      : { id: String(order.user_id || ''), name: '', email: '' }
  }
  return result
}

async function releaseInventory(order, session) {
  if (order.inventory_released_at) return
  for (const item of order.items) {
    await Product.updateOne(
      { _id: item.product_id, 'variants.sku': item.variant_sku },
      { $inc: { 'variants.$.stock': item.quantity } },
      { session },
    )
  }
  order.inventory_released_at = new Date()
}

function requestRefundIfNeeded(order, actorType, actorId, note) {
  if (order.payment_method !== 'VNPAY' || order.payment_status !== 'paid') return
  order.refund.status = 'requested'
  order.refund.requested_at = new Date()
  appendEvent(order, 'refund_requested', actorType, actorId, note)
}

export async function listOrdersForUser(userId, query = {}) {
  validateListQuery(query)
  const { page, limit, skip } = paginationOf(query)
  const filter = { user_id: userId }
  if (query.status && ORDER_STATUSES.includes(query.status)) filter.status = query.status
  if (query.search?.trim()) filter.order_code = { $regex: escapeRegex(query.search.trim()), $options: 'i' }

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
      .populate('items.product_id', 'images').lean(),
    Order.countDocuments(filter),
  ])
  return { data: orders.map((order) => serializeOrder(order)), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}

export async function listOrdersForAdmin(query = {}) {
  validateListQuery(query, { admin: true })
  const { page, limit, skip } = paginationOf(query)
  const filter = {}
  if (query.status && ORDER_STATUSES.includes(query.status)) filter.status = query.status
  if (query.paymentStatus && PAYMENT_STATUSES.includes(query.paymentStatus)) filter.payment_status = query.paymentStatus
  if (query.search?.trim()) filter.order_code = { $regex: escapeRegex(query.search.trim()), $options: 'i' }

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
      .populate('items.product_id', 'images').populate('user_id', 'name email').lean(),
    Order.countDocuments(filter),
  ])
  return { data: orders.map((order) => serializeOrder(order, { detail: true, admin: true })), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}

export async function getOrderForUser(orderCode, user) {
  const filter = { order_code: orderCode, ...(user.role !== 'admin' && { user_id: user.sub }) }
  const order = await Order.findOne(filter).populate('items.product_id', 'images').lean()
  if (!order) throw new AppError('Không tìm thấy đơn hàng', 404)
  return serializeOrder(order, { detail: true })
}

export async function cancelOrder(userId, orderCode, { reasonCode, note }) {
  const session = await mongoose.startSession()
  try {
    await session.withTransaction(async () => {
      const order = await Order.findOne({ order_code: orderCode, user_id: userId }).session(session)
      if (!order) throw new AppError('Không tìm thấy đơn hàng', 404)
      if (!['pending', 'processing'].includes(order.status)) throw new AppError('Chỉ có thể hủy đơn trước khi giao hàng', 409)

      order.status = 'canceled'
      order.cancel_reason = reasonCode
      order.cancellation.reason_code = reasonCode
      order.cancellation.note = note
      order.cancellation.canceled_by = userId
      order.cancellation.canceled_at = new Date()
      appendEvent(order, 'canceled', 'customer', userId, note)
      requestRefundIfNeeded(order, 'customer', userId, note)
      await releaseInventory(order, session)
      await order.save({ session })
    })
  } finally {
    await session.endSession()
  }
  return getOrderForUser(orderCode, { sub: userId, role: 'customer' })
}

export async function reorder(userId, orderCode) {
  const order = await Order.findOne({ order_code: orderCode, user_id: userId }).lean()
  if (!order) throw new AppError('Không tìm thấy đơn hàng', 404)

  const productIds = [...new Set(order.items.map((item) => String(item.product_id)))]
  const products = await Product.find({ _id: { $in: productIds }, is_deleted: false, status: 'available' }).lean()
  const productMap = new Map(products.map((product) => [String(product._id), product]))
  let cart = await Cart.findOne({ user_id: userId })
  if (!cart) cart = new Cart({ user_id: userId, items: [] })
  const addedItems = []
  const skippedItems = []

  for (const orderedItem of order.items) {
    const product = productMap.get(String(orderedItem.product_id))
    const variant = product?.variants.find((entry) => entry.sku === orderedItem.variant_sku)
    if (!product || !variant) {
      skippedItems.push({ variantSku: orderedItem.variant_sku, name: orderedItem.product_name, reason: 'unavailable' })
      continue
    }
    const existing = cart.items.find((entry) => entry.variant_sku === orderedItem.variant_sku)
    const currentQuantity = existing?.quantity || 0
    const addedQuantity = allocateReorderQuantity(orderedItem.quantity, currentQuantity, variant.stock)
    if (!addedQuantity) {
      skippedItems.push({ variantSku: orderedItem.variant_sku, name: orderedItem.product_name, reason: 'out_of_stock' })
      continue
    }
    if (existing) existing.quantity += addedQuantity
    else cart.items.push({ product_id: orderedItem.product_id, variant_sku: orderedItem.variant_sku, quantity: addedQuantity })
    addedItems.push({
      productId: String(orderedItem.product_id), variantSku: orderedItem.variant_sku, name: orderedItem.product_name,
      requestedQuantity: orderedItem.quantity, addedQuantity,
    })
    if (addedQuantity < orderedItem.quantity) skippedItems.push({
      variantSku: orderedItem.variant_sku, name: orderedItem.product_name, reason: 'partial_stock',
      requestedQuantity: orderedItem.quantity, addedQuantity,
    })
  }

  if (addedItems.length) await cart.save()
  return { cart: await getCart(userId), addedItems, skippedItems }
}

export async function updateOrderStatus(adminId, orderCode, data) {
  const session = await mongoose.startSession()
  try {
    await session.withTransaction(async () => {
      const order = await Order.findOne({ order_code: orderCode }).session(session)
      if (!order) throw new AppError('Không tìm thấy đơn hàng', 404)
      if (!allowedAdminTransitions(order.status).includes(data.status)) {
        throw new AppError(`Không thể chuyển đơn từ ${order.status} sang ${data.status}`, 409)
      }

      order.status = data.status
      if (data.status === 'shipped') {
        order.shipment.carrier = data.carrier
        order.shipment.tracking_code = data.trackingCode
        order.shipment.estimated_delivery_at = data.estimatedDeliveryAt ? new Date(data.estimatedDeliveryAt) : null
        order.shipment.shipped_at = new Date()
      } else if (data.status === 'completed') {
        order.shipment.delivered_at = new Date()
      } else if (data.status === 'canceled') {
        order.cancel_reason = 'other'
        order.cancellation.reason_code = 'other'
        order.cancellation.note = data.note
        order.cancellation.canceled_by = adminId
        order.cancellation.canceled_at = new Date()
        await releaseInventory(order, session)
      }
      appendEvent(order, data.status, 'admin', adminId, data.note)
      if (data.status === 'canceled') requestRefundIfNeeded(order, 'admin', adminId, data.note)
      await order.save({ session })
    })
  } finally {
    await session.endSession()
  }
  return getOrderForUser(orderCode, { sub: adminId, role: 'admin' })
}

export async function completeRefund(adminId, orderCode, { reference, note }) {
  const now = new Date()
  const order = await Order.findOneAndUpdate(
    { order_code: orderCode, 'refund.status': 'requested' },
    {
      $set: { 'refund.status': 'completed', 'refund.completed_at': now, 'refund.reference': reference, 'refund.note': note, 'refund.processed_by': adminId },
      $push: { status_history: { event: 'refund_completed', actor_type: 'admin', actor_id: adminId, note, occurred_at: now } },
    },
    { returnDocument: 'after' },
  )
  if (!order) {
    if (!await Order.exists({ order_code: orderCode })) throw new AppError('Không tìm thấy đơn hàng', 404)
    throw new AppError('Đơn hàng không có yêu cầu hoàn tiền đang chờ', 409)
  }
  return getOrderForUser(orderCode, { sub: adminId, role: 'admin' })
}
