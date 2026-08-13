export const ORDER_STATUSES = ['pending', 'processing', 'ready_to_ship', 'shipped', 'completed', 'canceled']
export const CUSTOMER_CANCEL_REASONS = ['changed_mind', 'wrong_information', 'duplicate_order', 'delivery_too_long', 'other']

const transitions = {
  pending: ['processing', 'ready_to_ship', 'shipped', 'canceled'],
  processing: ['ready_to_ship', 'shipped', 'canceled'],
  ready_to_ship: ['shipped'],
  shipped: [],
  completed: [],
  canceled: [],
}

export function allowedAdminTransitions(status) {
  return transitions[status] || []
}

export function canAdminFulfill(paymentMethod, paymentStatus) {
  return paymentMethod === 'COD' ? paymentStatus === 'cod_pending' : paymentMethod === 'VNPAY' && paymentStatus === 'paid'
}

export function paymentStatusAfterReceived(paymentMethod, paymentStatus) {
  return paymentMethod === 'COD' && paymentStatus === 'cod_pending' ? 'paid' : paymentStatus
}

export function allocateReorderQuantity(requested, currentInCart, stock) {
  return Math.max(0, Math.min(requested, stock - currentInCart))
}

export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function legacyStatusHistory(order) {
  if (order.status_history?.length) return order.status_history
  const history = [{ event: 'order_created', occurred_at: order.createdAt, actor_type: 'system', note: '' }]
  const currentEvent = {
    processing: 'processing', ready_to_ship: 'ready_to_ship', shipped: 'shipped', completed: 'completed', canceled: 'canceled',
  }[order.status]
  if (currentEvent) history.push({ event: currentEvent, occurred_at: order.updatedAt, actor_type: 'system', note: 'Trạng thái từ đơn hàng cũ' })
  else if (order.payment_status === 'paid') history.push({ event: 'payment_confirmed', occurred_at: order.updatedAt, actor_type: 'system', note: 'Trạng thái từ đơn hàng cũ' })
  return history
}
