export const orderStatusMeta = {
  pending_payment: { label: 'Chờ thanh toán', tone: 'amber' },
  pending: { label: 'Chờ xác nhận', tone: 'amber' },
  processing: { label: 'Đang xử lý', tone: 'blue' },
  shipped: { label: 'Đang giao', tone: 'violet' },
  completed: { label: 'Hoàn tất', tone: 'emerald' },
  canceled: { label: 'Đã hủy', tone: 'red' },
}

export const paymentStatusLabels = {
  pending_payment: 'Chờ thanh toán', payment_review: 'Đang đối soát', paid: 'Đã thanh toán',
  failed: 'Thanh toán thất bại', expired: 'Đã hết hạn', cod_pending: 'Thanh toán khi nhận hàng',
}

export const refundStatusLabels = {
  none: '', requested: 'Đang chờ hoàn tiền', completed: 'Đã hoàn tiền',
}

export const cancelReasonLabels = {
  changed_mind: 'Thay đổi quyết định', wrong_information: 'Sai thông tin đơn hàng',
  duplicate_order: 'Đặt trùng đơn', delivery_too_long: 'Thời gian giao quá lâu', other: 'Lý do khác',
}

export const statusToneClasses = {
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
}

export const formatOrderDate = (value, withTime = false) => {
  if (!value) return '—'
  return new Intl.DateTimeFormat('vi-VN', withTime
    ? { dateStyle: 'short', timeStyle: 'short' }
    : { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value))
}
