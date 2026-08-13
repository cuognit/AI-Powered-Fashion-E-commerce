import { Clock3, MapPin, Truck, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import OrderItemList from '../../orders/OrderItemList.jsx'
import OrderStatusBadge from '../../orders/OrderStatusBadge.jsx'
import { formatCurrency } from '../../../utils/formatCurrency.js'
import { formatOrderDate, orderStatusMeta, paymentStatusLabels, refundStatusLabels } from '../../../utils/orderStatus.js'

const nextActions = {
  pending: [['processing', 'Chờ xử lý đơn'], ['ready_to_ship', 'Chờ vận chuyển'], ['shipped', 'Đang giao'], ['canceled', 'Hủy đơn']],
  processing: [['ready_to_ship', 'Chờ vận chuyển'], ['shipped', 'Đang giao'], ['canceled', 'Hủy đơn']],
  ready_to_ship: [['shipped', 'Đang giao']],
}

export default function AdminOrderDrawer({ order, busy = false, onClose, onUpdate, onRefund, readOnly = false }) {
  const [closing, setClosing] = useState(false)
  const [action, setAction] = useState('')
  const [note, setNote] = useState('')
  const [carrier, setCarrier] = useState('')
  const [trackingCode, setTrackingCode] = useState('')
  const [estimatedDeliveryAt, setEstimatedDeliveryAt] = useState('')
  const [refundReference, setRefundReference] = useState('')
  const [refundNote, setRefundNote] = useState('')

  const requestClose = useCallback(() => {
    if (busy || closing) return
    setClosing(true)
    window.setTimeout(onClose, 220)
  }, [busy, closing, onClose])

  useEffect(() => {
    const closeOnEscape = (event) => { if (event.key === 'Escape') requestClose() }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [requestClose])

  if (!order) return null

  const submitStatus = (event) => {
    event.preventDefault()
    if (!action) return
    onUpdate({ status: action, note, carrier: carrier || undefined, trackingCode: trackingCode || undefined, estimatedDeliveryAt: estimatedDeliveryAt ? new Date(estimatedDeliveryAt).toISOString() : null })
  }

  return <div className={`admin-drawer-backdrop fixed inset-0 z-[100] flex justify-end bg-black/50 ${closing ? 'is-closing' : ''}`} role='dialog' aria-modal='true' aria-label={`Chi tiết đơn hàng ${order.orderCode}`}>
    <button type='button' className='admin-static-control absolute inset-0' onClick={requestClose} aria-label='Đóng chi tiết đơn hàng' />
    <div className='admin-drawer-panel relative h-full w-full max-w-2xl overflow-y-auto bg-[#f4f2ed] p-5 shadow-2xl sm:p-8'>
      <div className='flex items-start justify-between border-b border-black pb-5'><div><div className='flex flex-wrap items-center gap-3'><p className='font-mono text-sm font-bold'>{order.orderCode}</p><OrderStatusBadge status={order.status} /></div><h2 className='mt-2 text-2xl font-black uppercase'>Chi tiết đơn hàng</h2><p className='mt-1 text-xs text-neutral-500'>{formatOrderDate(order.createdAt, true)}</p></div><button type='button' onClick={requestClose} disabled={busy} className='grid h-10 w-10 place-items-center bg-white disabled:opacity-40'><X /></button></div>
      <div className='mt-5 grid gap-4 sm:grid-cols-2'><div className='bg-white p-5'><p className='text-[10px] font-bold uppercase text-neutral-500'>Khách hàng</p><b className='mt-2 block'>{order.customer?.name || 'Khách hàng'}</b><p className='text-xs text-neutral-500'>{order.customer?.email || '—'}</p><p className='mt-3 text-sm'>{order.phoneNumber}</p></div><div className='bg-white p-5'><p className='text-[10px] font-bold uppercase text-neutral-500'>Thanh toán</p><b className='mt-2 block'>{paymentStatusLabels[order.paymentStatus]}</b><p className='text-sm'>{order.paymentMethod}</p><p className='mt-3 text-xl font-black'>{formatCurrency(order.totalAmount)}</p></div></div>
      <div className='mt-4 bg-white p-5'><p className='flex items-center gap-2 text-[10px] font-bold uppercase text-neutral-500'><MapPin className='h-4 w-4' />Địa chỉ giao hàng</p><p className='mt-2 text-sm leading-6'>{order.shippingAddress}</p>{order.note && <p className='mt-3 border-l-2 border-black pl-3 text-xs italic'>Ghi chú: {order.note}</p>}</div>
      {order.shipment?.trackingCode && <div className='mt-4 bg-black p-5 text-sm text-white'><p className='flex items-center gap-2 text-[10px] font-bold uppercase text-neutral-400'><Truck className='h-4 w-4' />Vận chuyển</p><div className='mt-3 flex justify-between gap-3'><b>{order.shipment.carrier}</b><span className='font-mono'>{order.shipment.trackingCode}</span></div></div>}
      <div className='mt-4 bg-white p-5'><OrderItemList items={order.items} /></div>
      {!!order.statusHistory?.length && <div className='mt-4 bg-white p-5'><h3 className='flex items-center gap-2 text-sm font-black uppercase'><Clock3 className='h-4 w-4' />Lịch sử trạng thái</h3><div className='mt-4 space-y-3'>{[...order.statusHistory].reverse().map((entry, index) => <div key={`${entry.event}-${entry.occurredAt}-${index}`} className='border-l-2 border-neutral-200 pl-3'><p className='text-xs font-bold uppercase'>{orderStatusMeta[entry.event]?.label || entry.event.replaceAll('_', ' ')}</p><p className='text-[11px] text-neutral-500'>{formatOrderDate(entry.occurredAt, true)} · {entry.actorType}</p>{entry.note && <p className='mt-1 text-xs'>{entry.note}</p>}</div>)}</div></div>}
      {order.status === 'shipped' && <div className='mt-4 border border-violet-200 bg-violet-50 p-5 text-sm font-bold text-violet-800'>Chờ khách hàng xác nhận đã nhận hàng.</div>}
      {!readOnly && !!nextActions[order.status]?.length && <form onSubmit={submitStatus} className='mt-4 bg-white p-5'><h3 className='text-sm font-black uppercase'>Cập nhật trạng thái</h3><div className='mt-4 grid gap-2 sm:grid-cols-2'>{nextActions[order.status].map(([value, label]) => <label key={value} className={`cursor-pointer border p-3 text-xs font-bold ${action === value ? 'border-black bg-black text-white' : 'border-neutral-200'}`}><input type='radio' name='action' value={value} checked={action === value} onChange={() => setAction(value)} className='sr-only' />{label}</label>)}</div>{action === 'shipped' && <div className='mt-4 grid gap-3 sm:grid-cols-2'><input required value={carrier} onChange={(event) => setCarrier(event.target.value)} placeholder='Đơn vị vận chuyển' className='border p-3 text-sm' /><input required value={trackingCode} onChange={(event) => setTrackingCode(event.target.value)} placeholder='Mã vận đơn' className='border p-3 text-sm' /><label className='text-xs font-bold sm:col-span-2'>Ngày giao dự kiến<input type='datetime-local' value={estimatedDeliveryAt} onChange={(event) => setEstimatedDeliveryAt(event.target.value)} className='mt-2 block w-full border p-3 text-sm font-normal' /></label></div>}<textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} placeholder='Ghi chú nội bộ (tùy chọn)' className='mt-4 w-full border p-3 text-sm' /><button disabled={busy || !action} className={`mt-4 w-full px-5 py-3 text-xs font-black uppercase text-white disabled:opacity-40 ${action === 'canceled' ? 'bg-red-600' : 'bg-black'}`}>{busy ? 'Đang cập nhật...' : 'Cập nhật đơn hàng'}</button></form>}
      {!readOnly && order.refund?.status === 'requested' && <form onSubmit={(event) => { event.preventDefault(); onRefund({ status: 'completed', reference: refundReference, note: refundNote }) }} className='mt-4 border border-amber-200 bg-amber-50 p-5'><h3 className='font-black uppercase text-amber-900'>Yêu cầu hoàn tiền</h3><input value={refundReference} onChange={(event) => setRefundReference(event.target.value)} placeholder='Mã tham chiếu hoàn tiền' className='mt-4 w-full border p-3 text-sm' /><textarea value={refundNote} onChange={(event) => setRefundNote(event.target.value)} maxLength={500} placeholder='Ghi chú hoàn tiền' className='mt-3 w-full border p-3 text-sm' /><button disabled={busy} className='mt-3 w-full bg-amber-700 px-5 py-3 text-xs font-black uppercase text-white'>Xác nhận đã hoàn tiền</button></form>}
      {order.refund?.status === 'completed' && <div className='mt-4 bg-emerald-50 p-5 text-sm text-emerald-800'><b>{refundStatusLabels.completed}</b></div>}
    </div>
  </div>
}
