import { ChevronLeft, ChevronRight, Mail, MapPin, Phone, RefreshCw, ShoppingBag, UserRound, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import OrderStatusBadge from '../../orders/OrderStatusBadge.jsx'
import { getAdminCustomer, listAdminCustomerOrders } from '../../../services/adminCustomerApi.js'
import { formatCurrency } from '../../../utils/formatCurrency.js'
import { formatOrderDate } from '../../../utils/orderStatus.js'

const emptyPagination = { page: 1, totalPages: 1, total: 0 }
const messageOf = (error) => error.response?.data?.message || 'Không thể tải dữ liệu khách hàng'

function Statistic({ label, value, dark = false }) {
  return <div className={dark ? 'bg-black p-4 text-white' : 'bg-white p-4'}><p className={`text-[9px] font-bold uppercase tracking-[0.12em] ${dark ? 'text-neutral-400' : 'text-neutral-500'}`}>{label}</p><b className='mt-1 block text-lg'>{value}</b></div>
}

export default function AdminCustomerDrawer({ customer, onClose, onOrderSelect, escapeDisabled = false }) {
  const [closing, setClosing] = useState(false)
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState('')
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [ordersError, setOrdersError] = useState('')
  const [pagination, setPagination] = useState(emptyPagination)
  const [page, setPage] = useState(1)

  const requestClose = useCallback(() => {
    if (closing) return
    setClosing(true)
    window.setTimeout(onClose, 220)
  }, [closing, onClose])

  const loadProfile = useCallback(async () => {
    setProfileLoading(true); setProfileError('')
    try { setProfile(await getAdminCustomer(customer.id)) }
    catch (error) { setProfileError(messageOf(error)) }
    finally { setProfileLoading(false) }
  }, [customer.id])

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true); setOrdersError('')
    try {
      const result = await listAdminCustomerOrders(customer.id, { page, limit: 8, sort: 'newest' })
      setOrders(result.data || [])
      setPagination(result.pagination || emptyPagination)
    } catch (error) { setOrdersError(messageOf(error)) }
    finally { setOrdersLoading(false) }
  }, [customer.id, page])

  useEffect(() => { loadProfile() }, [loadProfile])
  useEffect(() => { loadOrders() }, [loadOrders])
  useEffect(() => {
    if (escapeDisabled) return undefined
    const closeOnEscape = (event) => { if (event.key === 'Escape') requestClose() }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [escapeDisabled, requestClose])

  const details = profile || customer
  const statistics = profile?.statistics || customer
  const displayName = details.name || details.email || 'Khách hàng'

  return <div className={`admin-drawer-backdrop fixed inset-0 z-[100] flex justify-end bg-black/55 ${closing ? 'is-closing' : ''}`} role='dialog' aria-modal='true' aria-label={`Chi tiết khách hàng ${displayName}`}>
    <button type='button' className='admin-static-control absolute inset-0' onClick={requestClose} aria-label='Đóng chi tiết khách hàng' />
    <aside className='admin-drawer-panel relative h-full w-full max-w-2xl overflow-y-auto bg-[#f4f2ed] p-5 shadow-2xl sm:p-8'>
      <header className='flex items-start justify-between border-b border-black pb-5'>
        <div className='flex min-w-0 items-center gap-4'>
          <span className='grid h-14 w-14 shrink-0 place-items-center bg-black text-xl font-black text-white'>{displayName.charAt(0).toUpperCase()}</span>
          <div className='min-w-0'><p className='text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-500'>Hồ sơ khách hàng</p><h2 className='mt-1 truncate text-2xl font-black uppercase'>{displayName}</h2><p className='mt-1 text-xs text-neutral-500'>Tham gia {formatOrderDate(details.createdAt)}</p></div>
        </div>
        <button type='button' onClick={requestClose} className='grid h-10 w-10 shrink-0 place-items-center bg-white' aria-label='Đóng'><X className='h-5 w-5' /></button>
      </header>

      {profileLoading ? <div className='mt-5 h-44 animate-pulse bg-white' /> : profileError ? <div className='mt-5 border border-red-200 bg-red-50 p-5 text-sm text-red-700'><p>{profileError}</p><button type='button' onClick={loadProfile} className='mt-3 inline-flex items-center gap-2 bg-black px-4 py-2 text-[10px] font-black uppercase text-white'><RefreshCw className='h-3.5 w-3.5' />Thử lại</button></div> : <>
        <div className='mt-5 grid gap-3 sm:grid-cols-2'>
          <div className='bg-white p-5'><p className='flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.12em] text-neutral-500'><Mail className='h-4 w-4' />Email</p><p className='mt-2 break-all text-sm font-bold'>{details.email || 'Chưa cập nhật'}</p></div>
          <div className='bg-white p-5'><p className='flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.12em] text-neutral-500'><Phone className='h-4 w-4' />Điện thoại</p><p className='mt-2 text-sm font-bold'>{details.phone || 'Chưa cập nhật'}</p></div>
          <div className='bg-white p-5 sm:col-span-2'><p className='flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.12em] text-neutral-500'><MapPin className='h-4 w-4' />Địa chỉ</p><p className='mt-2 text-sm leading-6'>{details.address || 'Khách hàng chưa cập nhật địa chỉ.'}</p></div>
        </div>
        <div className='mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4'><Statistic label='Tổng đơn' value={statistics.orderCount || 0} dark /><Statistic label='Đang xử lý' value={statistics.activeOrders || 0} /><Statistic label='Đã giao' value={statistics.completedOrders || 0} /><Statistic label='Tổng chi tiêu' value={formatCurrency(statistics.totalSpent || 0)} /></div>
      </>}

      <section className='mt-6'>
        <div className='flex items-end justify-between border-b border-black pb-3'><div><p className='text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-500'>Hoạt động mua sắm</p><h3 className='mt-1 text-lg font-black uppercase'>Lịch sử đơn hàng</h3></div><span className='text-xs font-bold'>{pagination.total} đơn</span></div>
        {ordersLoading ? <div className='mt-4 h-64 animate-pulse bg-white' /> : ordersError ? <div className='mt-4 border border-red-200 bg-red-50 p-5 text-sm text-red-700'><p>{ordersError}</p><button type='button' onClick={loadOrders} className='mt-3 inline-flex items-center gap-2 bg-black px-4 py-2 text-[10px] font-black uppercase text-white'><RefreshCw className='h-3.5 w-3.5' />Thử lại</button></div> : !orders.length ? <div className='mt-4 bg-white p-10 text-center'><ShoppingBag className='mx-auto h-9 w-9 text-neutral-300' /><p className='mt-3 text-sm font-black uppercase'>Chưa có đơn hàng</p></div> : <div className='mt-4 space-y-3'>{orders.map((order) => <article key={order.orderCode} role='button' tabIndex={0} onClick={() => onOrderSelect(order)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOrderSelect(order) } }} className='group cursor-pointer bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-black sm:p-5'><div className='flex flex-wrap items-start justify-between gap-3'><div><p className='font-mono text-xs font-black underline-offset-4 group-hover:underline'>{order.orderCode}</p><p className='mt-1 text-[11px] text-neutral-500'>{formatOrderDate(order.createdAt, true)} · {order.itemCount} sản phẩm</p></div><OrderStatusBadge status={order.status} /></div><div className='mt-4 flex items-end justify-between border-t pt-3'><div><p className='text-[9px] font-bold uppercase text-neutral-400'>{order.paymentMethod}</p><p className='text-xs text-neutral-500'>{order.shippingAddress || 'Không có địa chỉ giao hàng'}</p></div><div className='text-right'><b className='block'>{formatCurrency(order.totalAmount)}</b><span className='mt-1 block text-[9px] font-black uppercase tracking-[0.08em] text-neutral-500'>Xem chi tiết</span></div></div></article>)}</div>}
        {pagination.totalPages > 1 && <div className='mt-4 flex items-center justify-center gap-4'><button type='button' disabled={page <= 1 || ordersLoading} onClick={() => setPage((value) => value - 1)} className='grid h-9 w-9 place-items-center bg-white disabled:opacity-30' aria-label='Trang trước'><ChevronLeft className='h-4 w-4' /></button><span className='text-xs font-black'>Trang {pagination.page}/{pagination.totalPages}</span><button type='button' disabled={page >= pagination.totalPages || ordersLoading} onClick={() => setPage((value) => value + 1)} className='grid h-9 w-9 place-items-center bg-white disabled:opacity-30' aria-label='Trang sau'><ChevronRight className='h-4 w-4' /></button></div>}
      </section>
    </aside>
  </div>
}
