import Order from '../models/Order.js'
import env from '../config/env.js'

const ORDER_KEYWORDS_REGEX = /(đơn hàng|don hang|mã đơn|ma don|mã vận đơn|tra cứu đơn|kiểm tra đơn|tình trạng đơn|giao hàng|đang giao|đã giao|order|tracking|AEST-[A-Z0-9-]+|ORD-[A-Z0-9-]+)/i
const ORDER_CODE_REGEX = /\b((?:AEST|ORD)-[A-Z0-9]+(?:-[A-Z0-9]+)*)\b/i

/**
 * Kiểm tra xem câu hỏi của người dùng có liên quan đến việc tra cứu đơn hàng hay không.
 * @param {string} message 
 * @returns {boolean}
 */
export function isOrderQuery(message = '') {
  const text = String(message || '')
  return ORDER_KEYWORDS_REGEX.test(text) || Boolean(extractOrderCode(text))
}

/**
 * Trích xuất mã đơn hàng nếu có trong văn bản (ví dụ: AEST-ME123ABC-ABC123 hoặc ORD-12345ABC).
 * @param {string} message 
 * @returns {string|null}
 */
export function extractOrderCode(message = '') {
  const match = String(message || '').match(ORDER_CODE_REGEX)
  return match ? match[1].toUpperCase() : null
}

/**
 * Khử dữ liệu nhạy cảm của đơn hàng trước khi chuyển cho LLM làm ngữ cảnh.
 * @param {Object} order - Document Order từ MongoDB
 * @returns {Object} - Dữ liệu đơn hàng đã được lọc an toàn
 */
function sanitizeOrderForContext(order) {
  if (!order) return null

  const items = (order.items || []).map((item) => ({
    productName: item.product_name || 'Sản phẩm',
    variantSku: item.variant_sku || '',
    color: item.color || '',
    size: item.size || '',
    quantity: item.quantity || 1,
    price: item.price || 0,
  }))

  const shipment = {
    carrier: order.shipment?.carrier || 'Đang cập nhật',
    trackingCode: order.shipment?.tracking_code || 'Chưa có',
    estimatedDeliveryAt: order.shipment?.estimated_delivery_at || null,
    shippedAt: order.shipment?.shipped_at || null,
    deliveredAt: order.shipment?.delivered_at || null,
  }

  const statusMapVi = {
    pending: 'Chờ xử lý',
    processing: 'Đang xử lý / Đóng gói',
    ready_to_ship: 'Đã đóng gói, sẵn sàng bàn giao vận chuyển',
    shipped: 'Đang giao hàng',
    completed: 'Đã giao thành công',
    canceled: 'Đã hủy',
  }

  const paymentStatusMapVi = {
    pending_payment: 'Chờ thanh toán',
    payment_review: 'Đang kiểm tra thanh toán',
    paid: 'Đã thanh toán',
    failed: 'Thanh toán thất bại',
    expired: 'Hết hạn thanh toán',
    cod_pending: 'Thanh toán khi nhận hàng (COD)',
  }

  return {
    orderCode: order.order_code,
    createdAt: order.createdAt,
    status: order.status,
    statusDisplay: statusMapVi[order.status] || order.status,
    paymentStatus: order.payment_status,
    paymentStatusDisplay: paymentStatusMapVi[order.payment_status] || order.payment_status,
    paymentMethod: order.payment_method,
    totalAmount: order.total_amount,
    items,
    shipment,
  }
}

/**
 * Lấy ngữ cảnh đơn hàng cho Chatbot (Chỉ đọc, bảo mật theo user_id).
 * @param {Object} params
 * @param {string} params.message - Câu hỏi người dùng
 * @param {string|null} params.userId - ObjectId của user đăng nhập
 * @returns {Promise<{ requiresAuth: boolean, orders: Array<Object>, message?: string }>}
 */
export async function getOrderContextForChat({ message, userId }) {
  if (!isOrderQuery(message)) {
    return { requiresAuth: false, orders: [] }
  }

  // 1. Khách vãng lai (Guest) -> Yêu cầu đăng nhập
  if (!userId) {
    return {
      requiresAuth: true,
      orders: [],
      message: 'Bạn cần đăng nhập tài khoản để tra cứu thông tin và tình trạng đơn hàng của mình.',
    }
  }

  const specificOrderCode = extractOrderCode(message)
  const limit = env.chat.orderContextLimit || 3

  try {
    if (specificOrderCode) {
      // Tìm đích danh đơn hàng thuộc sở hữu của user
      const order = await Order.findOne({
        user_id: userId,
        order_code: specificOrderCode,
      }).lean()

      if (order) {
        return {
          requiresAuth: false,
          orders: [sanitizeOrderForContext(order)],
        }
      }

      return {
        requiresAuth: false,
        orders: [],
        message: `Không tìm thấy đơn hàng "${specificOrderCode}" trong tài khoản của bạn.`,
      }
    }

    // Tra cứu danh sách tối đa 3 đơn gần nhất
    const recentOrders = await Order.find({ user_id: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    return {
      requiresAuth: false,
      orders: recentOrders.map(sanitizeOrderForContext),
    }
  } catch (error) {
    console.error(`[chatOrderContext] Lỗi khi truy vấn đơn hàng của user ${userId}:`, error.message)
    return { requiresAuth: false, orders: [] }
  }
}

export default {
  isOrderQuery,
  extractOrderCode,
  getOrderContextForChat,
}
