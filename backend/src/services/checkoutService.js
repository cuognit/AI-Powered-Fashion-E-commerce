import { randomBytes } from 'node:crypto'
import axios from 'axios'
import mongoose from 'mongoose'
import env from '../config/env.js'
import Cart from '../models/Cart.js'
import Order from '../models/Order.js'
import PaymentTransaction from '../models/PaymentTransaction.js'
import Product from '../models/product.model.js'
import { AppError } from '../utils/AppError.js'
import { createVnpayUrl, formatVnpayDate, verifyVnpaySignature } from '../utils/vnpay.js'
import { queryRequestId, signQueryRequest, verifyQueryResponse } from '../utils/vnpayQuery.js'

const SHIPPING_FEE = 25_000
const PAYMENT_TTL_MS = 15 * 60_000
const QUERY_RETRY_MS = 5 * 60_000
const COUPONS = { VIP20: 20, AESTHETIX10: 10, AEST10: 10 }

function orderCode() { return `AEST-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}` }
function txnRef() { return `${Date.now()}${randomBytes(4).toString('hex')}` }

function discountFor(code) {
  if (!code) return 0
  const discount = COUPONS[code]
  if (!discount) throw new AppError('Mã giảm giá không hợp lệ', 400)
  return discount
}

async function buildAndReserveCart(userId, checkout, session) {
  const cart = await Cart.findOne({ user_id: userId }).session(session).lean()
  if (!cart?.items?.length) throw new AppError('Giỏ hàng đang trống', 400)
  const items = []
  let subtotal = 0

  for (const cartItem of cart.items) {
    const product = await Product.findOne({ _id: cartItem.product_id, is_deleted: false, status: 'available' }).session(session)
    const variant = product?.variants.find((entry) => entry.sku === cartItem.variant_sku)
    if (!product || !variant) throw new AppError('Một sản phẩm trong giỏ không còn khả dụng', 409)
    if (!Number.isInteger(cartItem.quantity) || cartItem.quantity < 1 || variant.stock < cartItem.quantity) {
      throw new AppError(`Không đủ tồn kho cho ${product.name}`, 409)
    }
    const price = product.sale_price ?? product.base_price
    if (!Number.isSafeInteger(price) || price < 0) throw new AppError('Giá sản phẩm không hợp lệ', 500)
    variant.stock -= cartItem.quantity
    await product.save({ session })
    subtotal += price * cartItem.quantity
    items.push({ product_id: product._id, product_name: product.name, image_url: product.images?.[0] || '', variant_sku: variant.sku, color: variant.color, size: variant.size, quantity: cartItem.quantity, price })
  }

  const discountPercent = discountFor(checkout.coupon)
  const discountAmount = Math.floor(subtotal * discountPercent / 100)
  const total = subtotal - discountAmount + SHIPPING_FEE
  if (!Number.isSafeInteger(total) || total < 5_000 || total > 1_000_000_000) throw new AppError('Tổng tiền không nằm trong giới hạn thanh toán', 400)
  return { items, subtotal, discountPercent, discountAmount, shippingFee: SHIPPING_FEE, total }
}

async function createOrder(userId, checkout, method, ipAddress) {
  const session = await mongoose.startSession()
  let result
  try {
    await session.withTransaction(async () => {
      const totals = await buildAndReserveCart(userId, checkout, session)
      const code = orderCode()
      const expiresAt = method === 'VNPAY' ? new Date(Date.now() + PAYMENT_TTL_MS) : null
      const [order] = await Order.create([{
        order_code: code, user_id: userId,
        shipping_address: [checkout.address, checkout.city, checkout.postalCode].filter(Boolean).join(', '),
        phone_number: checkout.phone, note: checkout.notes, total_amount: totals.total,
        payment_method: method, payment_status: method === 'VNPAY' ? 'pending_payment' : 'cod_pending',
        payment_expires_at: expiresAt, status: method === 'VNPAY' ? 'pending_payment' : 'pending', items: totals.items,
        status_history: [{ event: 'order_created', actor_type: 'system', occurred_at: new Date() }],
      }], { session })

      if (method === 'VNPAY') {
        if (!env.vnpay.tmnCode || !env.vnpay.hashSecret) throw new AppError('VNPAY chưa được cấu hình', 503)
        const reference = txnRef()
        const transactionDate = formatVnpayDate(new Date())
        await PaymentTransaction.create([{ txn_ref: reference, order_id: order._id, user_id: userId, amount: totals.total, expires_at: expiresAt, transaction_date: transactionDate, next_query_at: expiresAt }], { session })
        const params = {
          vnp_Version: env.vnpay.version, vnp_Command: 'pay', vnp_TmnCode: env.vnpay.tmnCode,
          vnp_Amount: totals.total * 100, vnp_CurrCode: 'VND', vnp_TxnRef: reference,
          vnp_OrderInfo: `Thanh toan don hang ${code}`, vnp_OrderType: 'other',
          vnp_Locale: env.vnpay.locale, vnp_ReturnUrl: env.vnpay.returnUrl,
          vnp_IpAddr: ipAddress, vnp_CreateDate: transactionDate, vnp_ExpireDate: formatVnpayDate(expiresAt),
          ...(checkout.bankCode && { vnp_BankCode: checkout.bankCode }),
        }
        result = { orderCode: code, paymentUrl: createVnpayUrl(env.vnpay.url, params, env.vnpay.hashSecret), expiresAt }
      } else result = { orderCode: code, paymentStatus: 'cod_pending' }

      if (method === 'COD') await Cart.deleteOne({ user_id: userId }, { session })
    })
    return result
  } finally { await session.endSession() }
}

export const createVnpayPayment = (userId, checkout, ip) => createOrder(userId, checkout, 'VNPAY', ip)
export const createCodOrder = (userId, checkout, ip) => createOrder(userId, checkout, 'COD', ip)

async function releaseInventory(order, session) {
  if (order.inventory_released_at) return
  for (const item of order.items) {
    await Product.updateOne(
      { _id: item.product_id, 'variants.sku': item.variant_sku },
      { $inc: { 'variants.$.stock': item.quantity } }, { session },
    )
  }
  order.inventory_released_at = new Date()
}

async function removePurchasedItemsFromCart(order, session) {
  const cart = await Cart.findOne({ user_id: order.user_id }).session(session)
  if (!cart) return
  for (const purchased of order.items) {
    const item = cart.items.find((entry) => entry.variant_sku === purchased.variant_sku)
    if (!item) continue
    item.quantity -= purchased.quantity
    if (item.quantity <= 0) cart.items = cart.items.filter((entry) => entry.variant_sku !== purchased.variant_sku)
  }
  if (cart.items.length) await cart.save({ session })
  else await Cart.deleteOne({ _id: cart._id }, { session })
}

function classifyVnpayResult(responseCode, transactionStatus) {
  if (responseCode === '00' && transactionStatus === '00') return 'paid'
  if (transactionStatus === '02') return 'failed'
  return 'payment_review'
}

async function applyPaymentResult(paymentId, result, providerData = {}) {
  const session = await mongoose.startSession()
  let applied = false
  try {
    await session.withTransaction(async () => {
      const payment = await PaymentTransaction.findOne({ _id: paymentId, status: { $in: ['pending', 'payment_review'] } }).session(session)
      if (!payment) return
      const order = await Order.findById(payment.order_id).session(session)
      if (!order) throw new AppError('Không tìm thấy đơn hàng của giao dịch', 404)
      payment.status = result
      payment.processed_at = result === 'payment_review' ? null : new Date()
      payment.vnp_transaction_no = providerData.vnp_TransactionNo || payment.vnp_transaction_no
      payment.response_code = providerData.vnp_ResponseCode || payment.response_code
      payment.transaction_status = providerData.vnp_TransactionStatus || payment.transaction_status
      payment.bank_code = providerData.vnp_BankCode || payment.bank_code
      payment.card_type = providerData.vnp_CardType || payment.card_type
      payment.pay_date = providerData.vnp_PayDate || payment.pay_date
      order.payment_status = result
      if (result === 'paid') {
        order.status = 'pending'
        order.status_history.push({ event: 'payment_confirmed', actor_type: 'system', occurred_at: new Date() })
        await removePurchasedItemsFromCart(order, session)
      } else if (result === 'failed') {
        order.status = 'canceled'
        order.status_history.push({ event: 'canceled', actor_type: 'system', occurred_at: new Date(), note: 'Thanh toán không thành công' })
        await releaseInventory(order, session)
      } else {
        order.status = 'pending_payment'
        payment.next_query_at = new Date(Date.now() + QUERY_RETRY_MS)
      }
      await payment.save({ session })
      await order.save({ session })
      applied = true
    })
    return applied
  } finally { await session.endSession() }
}

export async function processVnpayIpn(query) {
  if (!env.vnpay.hashSecret || !verifyVnpaySignature(query, env.vnpay.hashSecret)) return { RspCode: '97', Message: 'Invalid Checksum' }
  if (query.vnp_TmnCode !== env.vnpay.tmnCode) return { RspCode: '97', Message: 'Invalid Terminal' }
  const payment = await PaymentTransaction.findOne({ txn_ref: query.vnp_TxnRef })
  if (!payment) return { RspCode: '01', Message: 'Order not found' }
  if (Number(query.vnp_Amount) !== payment.amount * 100) return { RspCode: '04', Message: 'Invalid Amount' }
  if (payment.status === 'expired' && query.vnp_ResponseCode === '00' && query.vnp_TransactionStatus === '00') {
    // Legacy safeguard: inventory may already have been released by the former expiry job.
    // Flag for manual fulfillment instead of silently ignoring a valid late success.
    await PaymentTransaction.updateOne({ _id: payment._id, status: 'expired' }, { $set: {
      status: 'payment_review', vnp_transaction_no: query.vnp_TransactionNo || null,
      response_code: query.vnp_ResponseCode, transaction_status: query.vnp_TransactionStatus,
      bank_code: query.vnp_BankCode || null, card_type: query.vnp_CardType || null,
      pay_date: query.vnp_PayDate || null, next_query_at: null,
    } })
    await Order.updateOne({ _id: payment.order_id, payment_status: 'expired' }, { $set: { payment_status: 'payment_review', status: 'pending_payment' } })
    return { RspCode: '00', Message: 'Confirm Success' }
  }
  if (!['pending', 'payment_review'].includes(payment.status)) return { RspCode: '02', Message: 'Order already confirmed' }
  const result = classifyVnpayResult(query.vnp_ResponseCode, query.vnp_TransactionStatus)
  await applyPaymentResult(payment._id, result, query)
  return { RspCode: '00', Message: 'Confirm Success' }
}

export async function getReturnOrderCode(query) {
  if (!env.vnpay.hashSecret || !verifyVnpaySignature(query, env.vnpay.hashSecret)) return null
  const payment = await PaymentTransaction.findOne({ txn_ref: query.vnp_TxnRef }).populate('order_id', 'order_code').lean()
  return payment?.order_id?.order_code || null
}

export async function processVnpayReturn(query) {
  const orderCode = await getReturnOrderCode(query)
  if (!orderCode) return null

  // The browser return is a signed VNPAY response and is a safe fallback when
  // the server-to-server IPN is delayed or cannot reach a local/tunnel setup.
  // processVnpayIpn performs the terminal, amount and status checks and is
  // idempotent when the IPN has already confirmed the transaction.
  const result = await processVnpayIpn(query)
  return ['00', '02'].includes(result.RspCode) ? orderCode : null
}

export async function queryVnpayTransaction(paymentId, now = new Date()) {
  const payment = await PaymentTransaction.findById(paymentId)
  if (!payment || !['pending', 'payment_review'].includes(payment.status)) return null
  if (!payment.transaction_date) {
    payment.status = 'payment_review'
    payment.next_query_at = new Date(now.getTime() + QUERY_RETRY_MS)
    await payment.save()
    return { status: 'payment_review', reason: 'missing_transaction_date' }
  }

  const params = {
    vnp_RequestId: queryRequestId(), vnp_Version: env.vnpay.version, vnp_Command: 'querydr',
    vnp_TmnCode: env.vnpay.tmnCode, vnp_TxnRef: payment.txn_ref,
    vnp_TransactionDate: payment.transaction_date, vnp_CreateDate: formatVnpayDate(now),
    vnp_IpAddr: env.vnpay.queryIp, vnp_OrderInfo: `Truy van giao dich ${payment.txn_ref}`,
  }
  params.vnp_SecureHash = signQueryRequest(params, env.vnpay.hashSecret)

  let data
  try {
    const response = await axios.post(env.vnpay.queryUrl, params, { timeout: 10_000, headers: { 'Content-Type': 'application/json' } })
    data = response.data
  } catch {
    await PaymentTransaction.updateOne({ _id: payment._id, status: { $in: ['pending', 'payment_review'] } }, {
      $set: { status: 'payment_review', last_queried_at: now, next_query_at: new Date(now.getTime() + QUERY_RETRY_MS) },
      $inc: { query_attempts: 1 },
    })
    await Order.updateOne({ _id: payment.order_id, payment_status: { $in: ['pending_payment', 'payment_review'] } }, { $set: { payment_status: 'payment_review' } })
    return { status: 'payment_review', reason: 'query_unavailable' }
  }

  if (!verifyQueryResponse(data, env.vnpay.hashSecret) || data.vnp_TmnCode !== env.vnpay.tmnCode || data.vnp_TxnRef !== payment.txn_ref || Number(data.vnp_Amount) !== payment.amount * 100) {
    await PaymentTransaction.updateOne({ _id: payment._id }, { $set: { status: 'payment_review', last_queried_at: now, next_query_at: new Date(now.getTime() + QUERY_RETRY_MS) }, $inc: { query_attempts: 1 } })
    await Order.updateOne({ _id: payment.order_id }, { $set: { payment_status: 'payment_review' } })
    return { status: 'payment_review', reason: 'invalid_query_response' }
  }

  await PaymentTransaction.updateOne({ _id: payment._id }, { $set: { last_queried_at: now, query_response_code: data.vnp_ResponseCode }, $inc: { query_attempts: 1 } })
  const result = data.vnp_ResponseCode === '00'
    ? classifyVnpayResult(data.vnp_ResponseCode, data.vnp_TransactionStatus)
    : 'payment_review'
  await applyPaymentResult(payment._id, result, data)
  return { status: result, responseCode: data.vnp_ResponseCode, transactionStatus: data.vnp_TransactionStatus }
}

export async function reconcilePendingPayments(now = new Date()) {
  const candidates = await PaymentTransaction.find({
    status: { $in: ['pending', 'payment_review'] },
    $or: [{ next_query_at: { $lte: now } }, { next_query_at: null, expires_at: { $lte: now } }],
  }).select('_id').limit(20).lean()
  for (const candidate of candidates) await queryVnpayTransaction(candidate._id, now)
  return candidates.length
}

export async function expirePendingPayments(now = new Date()) {
  const candidates = await Order.find({
    payment_method: 'VNPAY',
    status: 'pending_payment',
    payment_status: { $in: ['pending_payment', 'payment_review'] },
    payment_expires_at: { $lte: now },
  }).limit(50).lean()

  let expiredCount = 0
  for (const candidate of candidates) {
    const session = await mongoose.startSession()
    try {
      await session.withTransaction(async () => {
        const order = await Order.findById(candidate._id).session(session)
        if (!order || order.status !== 'pending_payment' || order.payment_status === 'paid') return
        await PaymentTransaction.updateOne(
          { order_id: order._id, status: { $in: ['pending', 'payment_review'] } },
          { $set: { status: 'expired' } },
          { session },
        )
        order.payment_status = 'expired'
        order.status = 'canceled'
        order.status_history.push({ event: 'canceled', actor_type: 'system', occurred_at: now, note: 'Đơn hết hạn thanh toán' })
        await releaseInventory(order, session)
        await order.save({ session })
      })
      expiredCount += 1
    } finally { await session.endSession() }
  }
  return expiredCount
}
