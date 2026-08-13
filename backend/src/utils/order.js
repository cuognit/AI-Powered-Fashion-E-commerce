export const ORDER_STATUSES = ['pending_payment', 'pending', 'processing', 'shipped', 'completed', 'canceled']
export const CUSTOMER_CANCEL_REASONS = ['changed_mind', 'wrong_information', 'duplicate_order', 'delivery_too_long', 'other']

const transitions = {
  pending: ['processing', 'canceled'],
  processing: ['shipped', 'canceled'],
  shipped: ['completed'],
  completed: [],
  canceled: [],
  pending_payment: [],
}

export function allowedAdminTransitions(status) {
  return transitions[status] || []
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
    processing: 'processing', shipped: 'shipped', completed: 'completed', canceled: 'canceled',
  }[order.status]
  if (currentEvent) history.push({ event: currentEvent, occurred_at: order.updatedAt, actor_type: 'system', note: 'Trạng thái từ đơn hàng cũ' })
  else if (order.payment_status === 'paid') history.push({ event: 'payment_confirmed', occurred_at: order.updatedAt, actor_type: 'system', note: 'Trạng thái từ đơn hàng cũ' })
  return history
}
