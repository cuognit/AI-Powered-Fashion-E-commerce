import { ChevronLeft, ChevronRight, PackageSearch, RefreshCw, Search, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import OrderItemList from '../../components/orders/OrderItemList.jsx'
import OrderStatusBadge from '../../components/orders/OrderStatusBadge.jsx'
import { completeAdminRefund, listAdminOrders, updateAdminOrderStatus } from '../../services/orderApi.js'
import { formatCurrency } from '../../utils/formatCurrency.js'
import { formatOrderDate, paymentStatusLabels, refundStatusLabels } from '../../utils/orderStatus.js'

const nextActions = {
  pending: [['processing', 'Xác nhận & xử lý'], ['canceled', 'Hủy đơn']],
  processing: [['shipped', 'Bàn giao vận chuyển'], ['canceled', 'Hủy đơn']],
  shipped: [['completed', 'Xác nhận đã giao']],
}
const messageOf = (error) => error.response?.data?.message || 'Không thể xử lý yêu cầu'

function OrderDrawer({ order, busy, onClose, onUpdate, onRefund }) {
  const [action, setAction] = useState('')
  const [note, setNote] = useState('')
  const [carrier, setCarrier] = useState('')
  const [trackingCode, setTrackingCode] = useState('')
  const [estimatedDeliveryAt, setEstimatedDeliveryAt] = useState('')
  const [refundReference, setRefundReference] = useState('')
  const [refundNote, setRefundNote] = useState('')
  if (!order) return null
  const submitStatus = (event) => {
    event.preventDefault()
    if (!action) return
    onUpdate({ status: action, note, carrier: carrier || undefined, trackingCode: trackingCode || undefined, estimatedDeliveryAt: estimatedDeliveryAt ? new Date(estimatedDeliveryAt).toISOString() : null })
  }
  return <div className='fixed inset-0 z-[100] flex justify-end bg-black/40' role='dialog' aria-modal='true'>
    <div className='h-full w-full max-w-2xl overflow-y-auto bg-[#f4f2ed] p-5 shadow-2xl sm:p-8'>
      <div className='flex items-start justify-between'><div><p className='font-mono text-sm font-bold'>{order.orderCode}</p><h2 className='mt-1 text-2xl font-black uppercase'>Chi tiết đơn hàng</h2></div><button onClick={onClose} className='rounded-full bg-white p-2'><X /></button></div>
      <div className='mt-6 grid gap-4 sm:grid-cols-2'><div className='rounded-2xl bg-white p-5'><p className='text-[10px] font-bold uppercase text-neutral-500'>Khách hàng</p><b className='mt-2 block'>{order.customer?.name || 'Khách hàng'}</b><p className='text-xs text-neutral-500'>{order.customer?.email}</p><p className='mt-3 text-sm'>{order.phoneNumber}</p><p className='mt-1 text-sm'>{order.shippingAddress}</p></div><div className='rounded-2xl bg-white p-5'><p className='text-[10px] font-bold uppercase text-neutral-500'>Thanh toán</p><b className='mt-2 block'>{paymentStatusLabels[order.paymentStatus]}</b><p className='text-sm'>{order.paymentMethod}</p><p className='mt-4 text-xl font-black'>{formatCurrency(order.totalAmount)}</p></div></div>
      {order.shipment?.trackingCode && <div className='mt-4 rounded-2xl bg-black p-5 text-sm text-white'><p className='text-[10px] font-bold uppercase tracking-widest text-neutral-400'>Vận chuyển</p><div className='mt-2 flex flex-wrap justify-between gap-3'><b>{order.shipment.carrier}</b><span className='font-mono'>{order.shipment.trackingCode}</span></div></div>}
      <div className='mt-4 rounded-2xl bg-white p-5'><OrderItemList items={order.items} /></div>
      {!!nextActions[order.status]?.length && <form onSubmit={submitStatus} className='mt-4 rounded-2xl bg-white p-5'><h3 className='text-sm font-black uppercase'>Cập nhật trạng thái</h3><div className='mt-4 grid gap-2 sm:grid-cols-2'>{nextActions[order.status].map(([value, label]) => <label key={value} className={`cursor-pointer rounded-xl border p-3 text-xs font-bold ${action === value ? 'border-black bg-black text-white' : ''}`}><input type='radio' name='action' value={value} checked={action === value} onChange={() => setAction(value)} className='sr-only' />{label}</label>)}</div>
        {action === 'shipped' && <div className='mt-4 grid gap-3 sm:grid-cols-2'><input required value={carrier} onChange={(event) => setCarrier(event.target.value)} placeholder='Đơn vị vận chuyển' className='rounded-xl border p-3 text-sm' /><input required value={trackingCode} onChange={(event) => setTrackingCode(event.target.value)} placeholder='Mã vận đơn' className='rounded-xl border p-3 text-sm' /><label className='sm:col-span-2 text-xs font-bold'>Ngày giao dự kiến<input type='datetime-local' value={estimatedDeliveryAt} onChange={(event) => setEstimatedDeliveryAt(event.target.value)} className='mt-2 block w-full rounded-xl border p-3 text-sm font-normal' /></label></div>}
        <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} placeholder='Ghi chú nội bộ (tùy chọn)' className='mt-4 w-full rounded-xl border p-3 text-sm' />
        <button disabled={busy || !action} className={`mt-4 w-full rounded-xl px-5 py-3 text-xs font-black uppercase text-white disabled:opacity-40 ${action === 'canceled' ? 'bg-red-600' : 'bg-black'}`}>{busy ? 'Đang cập nhật...' : 'Cập nhật đơn hàng'}</button>
      </form>}
      {order.refund?.status === 'requested' && <form onSubmit={(event) => { event.preventDefault(); onRefund({ status: 'completed', reference: refundReference, note: refundNote }) }} className='mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-5'><h3 className='font-black uppercase text-amber-900'>Yêu cầu hoàn tiền</h3><p className='mt-2 text-sm text-amber-800'>Chỉ xác nhận sau khi đã hoàn tiền ngoài hệ thống.</p><input value={refundReference} onChange={(event) => setRefundReference(event.target.value)} placeholder='Mã tham chiếu hoàn tiền (tùy chọn)' className='mt-4 w-full rounded-xl border border-amber-300 bg-white p-3 text-sm' /><textarea value={refundNote} onChange={(event) => setRefundNote(event.target.value)} maxLength={500} placeholder='Ghi chú hoàn tiền (tùy chọn)' className='mt-3 w-full rounded-xl border border-amber-300 bg-white p-3 text-sm' /><button disabled={busy} className='mt-3 w-full rounded-xl bg-amber-700 px-5 py-3 text-xs font-black uppercase text-white'>Xác nhận đã hoàn tiền</button></form>}
      {order.refund?.status === 'completed' && <div className='mt-4 rounded-2xl bg-emerald-50 p-5 text-sm text-emerald-800'><b>{refundStatusLabels.completed}</b>{order.refund.reference && <p className='mt-1'>Tham chiếu: {order.refund.reference}</p>}</div>}
    </div>
  </div>
}

export default function ManageOrders() {
  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { const result = await listAdminOrders({ page, limit: 15, status: status || undefined, paymentStatus: paymentStatus || undefined, search: search || undefined }); setOrders(result.data || []); setPagination(result.pagination) }
    catch (requestError) { setError(messageOf(requestError)) }
    finally { setLoading(false) }
  }, [page, paymentStatus, search, status])
  useEffect(() => { load() }, [load])

  const updateStatus = async (payload) => {
    setBusy(true)
    try { const result = await updateAdminOrderStatus(selected.orderCode, payload); setSelected((current) => ({ ...current, ...result })); toast.success('Đã cập nhật trạng thái'); await load() }
    catch (requestError) { toast.error(messageOf(requestError)) }
    finally { setBusy(false) }
  }
  const completeRefund = async (payload) => {
    setBusy(true)
    try { const result = await completeAdminRefund(selected.orderCode, payload); setSelected((current) => ({ ...current, ...result })); toast.success('Đã ghi nhận hoàn tiền'); await load() }
    catch (requestError) { toast.error(messageOf(requestError)) }
    finally { setBusy(false) }
  }

  return <section className='px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10'>
    <div className='mx-auto max-w-[1360px]'><div className='flex flex-col justify-between gap-5 border-b border-black pb-6 lg:flex-row lg:items-end'><div><p className='text-xs font-bold uppercase tracking-[.25em] text-neutral-500'>Vận hành</p><h1 className='mt-2 text-3xl font-black uppercase sm:text-5xl'>Quản lý đơn hàng</h1><p className='mt-2 text-sm'>{pagination.total} đơn hàng</p></div><form onSubmit={(event) => { event.preventDefault(); setPage(1); setSearch(searchInput.trim()) }} className='flex rounded-xl bg-white'><Search className='ml-3 mt-3 h-4 w-4' /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder='Tìm mã đơn...' className='w-48 px-3 py-3 text-sm outline-none' /><button className='bg-black px-4 text-xs font-black uppercase text-white'>Tìm</button></form></div>
      <div className='my-5 flex flex-wrap gap-3'><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }} className='rounded-xl border bg-white p-3 text-sm'><option value=''>Mọi trạng thái giao hàng</option><option value='pending'>Chờ xác nhận</option><option value='processing'>Đang xử lý</option><option value='shipped'>Đang giao</option><option value='completed'>Hoàn tất</option><option value='canceled'>Đã hủy</option></select><select value={paymentStatus} onChange={(event) => { setPaymentStatus(event.target.value); setPage(1) }} className='rounded-xl border bg-white p-3 text-sm'><option value=''>Mọi trạng thái thanh toán</option><option value='paid'>Đã thanh toán</option><option value='cod_pending'>COD</option><option value='pending_payment'>Chờ thanh toán</option><option value='payment_review'>Đang đối soát</option></select><button onClick={load} className='rounded-xl border bg-white p-3'><RefreshCw className='h-4 w-4' /></button></div>
      <div className='overflow-hidden rounded-3xl bg-white shadow-sm'>{loading ? <div className='h-80 animate-pulse bg-neutral-100' /> : error ? <div className='p-12 text-center text-red-600'>{error}</div> : !orders.length ? <div className='p-12 text-center'><PackageSearch className='mx-auto h-12 w-12 text-neutral-400' /><p className='mt-3 font-black uppercase'>Không có đơn phù hợp</p></div> : <div className='overflow-x-auto'><table className='w-full min-w-[900px] text-left text-sm'><thead className='bg-neutral-50 text-[10px] font-black uppercase tracking-wider'><tr><th className='p-4'>Đơn hàng</th><th className='p-4'>Khách hàng</th><th className='p-4'>Thanh toán</th><th className='p-4'>Tổng tiền</th><th className='p-4'>Trạng thái</th><th className='p-4'></th></tr></thead><tbody className='divide-y'>{orders.map((order) => <tr key={order.orderCode} className='hover:bg-neutral-50'><td className='p-4'><b className='font-mono'>{order.orderCode}</b><p className='mt-1 text-xs text-neutral-500'>{formatOrderDate(order.createdAt, true)}</p></td><td className='p-4'><b>{order.customer?.name || 'Khách hàng'}</b><p className='text-xs text-neutral-500'>{order.customer?.email}</p></td><td className='p-4'>{paymentStatusLabels[order.paymentStatus]}</td><td className='p-4 font-bold'>{formatCurrency(order.totalAmount)}</td><td className='p-4'><OrderStatusBadge status={order.status} /></td><td className='p-4'><button onClick={() => setSelected(order)} className='rounded-xl bg-black px-4 py-2 text-xs font-black uppercase text-white'>Chi tiết</button></td></tr>)}</tbody></table></div>}</div>
      {pagination.totalPages > 1 && <div className='mt-6 flex justify-center gap-4'><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className='rounded-full bg-white p-2 disabled:opacity-30'><ChevronLeft /></button><span className='py-2 text-xs font-black'>Trang {page}/{pagination.totalPages}</span><button disabled={page >= pagination.totalPages} onClick={() => setPage((value) => value + 1)} className='rounded-full bg-white p-2 disabled:opacity-30'><ChevronRight /></button></div>}
    </div>
    <OrderDrawer key={selected?.orderCode || 'none'} order={selected} busy={busy} onClose={() => !busy && setSelected(null)} onUpdate={updateStatus} onRefund={completeRefund} />
  </section>
}
