import { Check, ChevronLeft, ChevronRight, Columns3, Eye, FilterX, List, PackageSearch, RefreshCw, Search, Truck, UserRound, Users } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import AdminOrderDrawer from '../../components/admin/orders/AdminOrderDrawer.jsx'
import OrderStatusBadge from '../../components/orders/OrderStatusBadge.jsx'
import { getAdminCustomer, listAdminCustomerOrders, listAdminCustomers } from '../../services/adminCustomerApi.js'
import { completeAdminRefund, listAdminOrders, updateAdminOrderStatus } from '../../services/orderApi.js'
import { formatCurrency } from '../../utils/formatCurrency.js'
import { formatOrderDate, orderStatusMeta, paymentStatusLabels } from '../../utils/orderStatus.js'

const statusOptions = ['', 'pending', 'processing', 'ready_to_ship', 'shipped', 'completed', 'canceled']
const boardStatuses = ['pending', 'processing', 'ready_to_ship', 'shipped', 'completed']
const messageOf = (error) => error.response?.data?.message || 'Không thể xử lý yêu cầu'

function QuickActions({ order, busy, onUpdate, onDetail }) {
  if (order.status === 'pending') return <button disabled={busy} onClick={() => onUpdate(order, { status: 'processing', note: 'Xác nhận nhanh từ danh sách quản trị' }, 'Xác nhận chuyển đơn sang chờ xử lý?')} className='inline-flex items-center gap-1.5 bg-black px-3 py-2 text-[10px] font-black uppercase text-white disabled:opacity-40'><Check className='h-3.5 w-3.5' />Xác nhận</button>
  if (['processing', 'ready_to_ship'].includes(order.status)) return <button disabled={busy} onClick={() => onDetail(order)} className='inline-flex items-center gap-1.5 bg-black px-3 py-2 text-[10px] font-black uppercase text-white'><Truck className='h-3.5 w-3.5' />Cập nhật</button>
  if (order.status === 'shipped') return <span className='text-[10px] font-bold uppercase text-violet-700'>Chờ khách xác nhận</span>
  return <button onClick={() => onDetail(order)} className='inline-flex items-center gap-1.5 border px-3 py-2 text-[10px] font-black uppercase'><Eye className='h-3.5 w-3.5' />Chi tiết</button>
}

function OrderTable({ orders, busyCode, onUpdate, onDetail }) {
  return <div className='overflow-x-auto'><table className='w-full min-w-[1040px] text-left text-sm'><thead className='border-b bg-neutral-50 text-[10px] font-black uppercase'><tr><th className='p-4'>Đơn hàng</th><th className='p-4'>Khách hàng</th><th className='p-4'>Sản phẩm</th><th className='p-4'>Thanh toán</th><th className='p-4'>Tổng tiền</th><th className='p-4'>Trạng thái</th><th className='p-4'>Thao tác</th></tr></thead><tbody className='divide-y'>{orders.map((order) => <tr key={order.orderCode} className='hover:bg-neutral-50'><td className='p-4'><button onClick={() => onDetail(order)} className='font-mono font-bold hover:underline'>{order.orderCode}</button><p className='text-xs text-neutral-500'>{formatOrderDate(order.createdAt, true)}</p></td><td className='p-4'><b>{order.customer?.name || 'Khách hàng'}</b><p className='max-w-44 truncate text-xs text-neutral-500'>{order.customer?.email}</p></td><td className='p-4'>{order.itemCount} sản phẩm</td><td className='p-4'><b className='text-xs'>{order.paymentMethod}</b><p className='text-xs text-neutral-500'>{paymentStatusLabels[order.paymentStatus]}</p></td><td className='p-4 font-bold'>{formatCurrency(order.totalAmount)}</td><td className='p-4'><OrderStatusBadge status={order.status} /></td><td className='p-4'><QuickActions order={order} busy={busyCode === order.orderCode} onUpdate={onUpdate} onDetail={onDetail} /></td></tr>)}</tbody></table></div>
}

function OrderBoard({ orders, busyCode, onUpdate, onDetail }) {
  return <div className='grid gap-4 xl:grid-cols-5'>{boardStatuses.map((status) => { const items = orders.filter((order) => order.status === status); return <section key={status} className='min-w-0 bg-neutral-100 p-3'><div className='mb-3 flex items-center justify-between'><OrderStatusBadge status={status} /><b className='text-xs'>{items.length}</b></div><div className='space-y-3'>{items.map((order) => <article key={order.orderCode} className='bg-white p-4 shadow-sm'><button onClick={() => onDetail(order)} className='font-mono text-xs font-bold hover:underline'>{order.orderCode}</button><p className='mt-3 truncate text-sm font-bold'>{order.customer?.name || 'Khách hàng'}</p><p className='text-[11px] text-neutral-500'>{order.itemCount} sản phẩm · {formatOrderDate(order.createdAt)}</p><p className='mt-3 font-black'>{formatCurrency(order.totalAmount)}</p><div className='mt-4 border-t pt-3'><QuickActions order={order} busy={busyCode === order.orderCode} onUpdate={onUpdate} onDetail={onDetail} /></div></article>)}{!items.length && <div className='border border-dashed p-6 text-center text-xs text-neutral-400'>Không có đơn</div>}</div></section> })}</div>
}

function CustomerView({ customers, onSelect }) {
  return <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>{customers.map((customer, index) => {
    const id = customer.id || customer.customerId || ''
    const displayName = String(customer.name || customer.email || 'Khách hàng')
    return <button key={id || `customer-${index}`} disabled={!id} onClick={() => id && onSelect({ ...customer, id })} className='bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60'>
      <span className='grid h-11 w-11 place-items-center rounded-full bg-black font-black text-white'>{displayName.charAt(0).toUpperCase()}</span>
      <h3 className='mt-4 font-black'>{customer.name || 'Khách hàng chưa cập nhật tên'}</h3>
      <p className='truncate text-xs text-neutral-500'>{customer.email || 'Chưa có email'}</p>
      <p className='text-xs text-neutral-500'>{customer.phone || 'Chưa có số điện thoại'}</p>
      <div className='mt-5 grid grid-cols-2 gap-3 border-t pt-4 text-xs'><div><span>Tổng đơn</span><b className='block text-base'>{customer.orderCount || 0}</b></div><div><span>Đang hoạt động</span><b className='block text-base'>{customer.activeOrders || 0}</b></div><div><span>Đã giao</span><b className='block text-base'>{customer.completedOrders || 0}</b></div><div><span>Tổng chi tiêu</span><b className='block'>{formatCurrency(customer.totalSpent || 0)}</b></div></div>
    </button>
  })}</div>
}

export default function ManageOrders() {
  const [rows, setRows] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [summary, setSummary] = useState({ counts: {}, total: 0, revenue: 0 })
  const [page, setPage] = useState(1)
  const [view, setView] = useState('list')
  const [status, setStatus] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [sort, setSort] = useState('newest')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [busy, setBusy] = useState(false)
  const [busyCode, setBusyCode] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      let result
      if (view === 'customers') result = await listAdminCustomers({ page, limit: 15, role: 'customer', search: search || undefined, sort: ['newest', 'oldest'].includes(sort) ? sort : 'newest' })
      else {
        const params = { page, limit: view === 'board' ? 50 : 15, status: status || undefined, paymentStatus: paymentStatus || undefined, paymentMethod: paymentMethod || undefined, sort, search: search || undefined }
        result = customer ? await listAdminCustomerOrders(customer.id, params) : await listAdminOrders(params)
      }
      setRows(result.data || []); setPagination(result.pagination || { page: 1, totalPages: 1, total: 0 })
      if (result.summary) setSummary(result.summary)
    } catch (requestError) { setError(messageOf(requestError)) }
    finally { setLoading(false) }
  }, [customer, page, paymentMethod, paymentStatus, search, sort, status, view])
  useEffect(() => { load() }, [load])

  const updateOrder = async (order, payload, confirmation) => {
    if (confirmation && !window.confirm(confirmation)) return
    setBusyCode(order.orderCode)
    try { const result = await updateAdminOrderStatus(order.orderCode, payload); setSelected((current) => current?.orderCode === order.orderCode ? result : current); toast.success('Đã cập nhật trạng thái'); await load() }
    catch (requestError) { toast.error(messageOf(requestError)) }
    finally { setBusyCode('') }
  }
  const updateSelected = async (payload) => { setBusy(true); try { const result = await updateAdminOrderStatus(selected.orderCode, payload); setSelected(result); toast.success('Đã cập nhật trạng thái'); await load() } catch (requestError) { toast.error(messageOf(requestError)) } finally { setBusy(false) } }
  const completeRefund = async (payload) => { setBusy(true); try { const result = await completeAdminRefund(selected.orderCode, payload); setSelected(result); toast.success('Đã ghi nhận hoàn tiền'); await load() } catch (requestError) { toast.error(messageOf(requestError)) } finally { setBusy(false) } }
  const chooseCustomer = async (value) => { const id = value.id || value.customerId; if (!id) return toast.error('Tài khoản khách hàng thiếu mã định danh'); setLoading(true); try { setCustomer(await getAdminCustomer(id)); setView('list'); setPage(1) } catch (requestError) { toast.error(messageOf(requestError)); setLoading(false) } }
  const resetFilters = () => { setStatus(''); setPaymentStatus(''); setPaymentMethod(''); setSort('newest'); setSearchInput(''); setSearch(''); setCustomer(null); setPage(1) }

  return <section className='px-4 py-8 lg:px-8'><div className='mx-auto max-w-[1360px]'>
    <div className='flex flex-col justify-between gap-5 border-b border-black pb-6 lg:flex-row lg:items-end'><div><p className='text-xs font-bold uppercase tracking-[.25em] text-neutral-500'>Trung tâm vận hành</p><h1 className='mt-2 text-3xl font-black uppercase sm:text-5xl'>Quản lý đơn hàng</h1></div>{view !== 'customers' && <div className='flex gap-3'><div className='bg-black px-5 py-3 text-white'><p className='text-[9px] uppercase text-neutral-400'>Tổng đơn</p><b className='text-xl'>{summary.total}</b></div><div className='bg-white px-5 py-3'><p className='text-[9px] uppercase text-neutral-500'>Doanh thu đã giao</p><b>{formatCurrency(summary.revenue)}</b></div></div>}</div>
    {view !== 'customers' && <div className='mt-5 flex gap-2 overflow-x-auto'>{statusOptions.map((value) => <button key={value || 'all'} onClick={() => { setStatus(value); setPage(1) }} className={`shrink-0 border px-4 py-2 text-[10px] font-black uppercase ${status === value ? 'bg-black text-white' : 'bg-white'}`}>{value ? orderStatusMeta[value]?.label : 'Tất cả'} ({value ? summary.counts?.[value] || 0 : summary.total})</button>)}</div>}
    <div className='mt-4 bg-white p-4'><div className='flex flex-col gap-3 xl:flex-row'><form onSubmit={(event) => { event.preventDefault(); setSearch(searchInput.trim()); setPage(1) }} className='flex flex-1 border'><Search className='ml-3 mt-3 h-4 w-4' /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder={view === 'customers' ? 'Tên, email hoặc số điện thoại...' : 'Mã đơn, tên, email hoặc số điện thoại...'} className='min-w-0 flex-1 px-3 py-3 text-sm outline-none' /><button className='bg-black px-4 text-xs font-black uppercase text-white'>Tìm</button></form>{view !== 'customers' && <div className='flex gap-2'><select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value)} className='border p-3 text-xs'><option value=''>Mọi thanh toán</option><option value='paid'>Đã thanh toán</option><option value='cod_pending'>COD chờ thu</option><option value='pending_payment'>Chờ thanh toán</option><option value='payment_review'>Đang đối soát</option></select><select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className='border p-3 text-xs'><option value=''>Mọi phương thức</option><option value='COD'>COD</option><option value='VNPAY'>VNPAY</option></select></div>}</div><div className='mt-3 flex items-center'><button onClick={resetFilters} className='flex gap-2 p-2 text-xs font-black uppercase text-neutral-500'><FilterX className='h-4 w-4' />Xóa bộ lọc</button><button onClick={load} disabled={loading} className='ml-auto border p-2'><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button></div></div>
    {customer && <div className='mt-4 flex flex-wrap items-center justify-between gap-3 bg-black px-4 py-3 text-white'><div><p className='flex items-center gap-2 text-xs'><UserRound className='h-4 w-4' />Đơn hàng của <b>{customer.name || customer.email || 'Khách hàng'}</b></p><p className='mt-1 text-[10px] text-neutral-300'>{customer.email || 'Chưa có email'} · {customer.statistics?.completedOrders || 0} đơn đã giao · {formatCurrency(customer.statistics?.totalSpent || 0)}</p></div><button onClick={() => { setCustomer(null); setView('customers'); setPage(1) }} className='text-xs font-black uppercase underline'>Quay lại khách hàng</button></div>}
    <div className='my-5 flex items-center justify-between'><p className='text-xs font-bold'>{pagination.total} {view === 'customers' ? 'khách hàng' : 'đơn phù hợp'}</p><div className='flex border bg-white p-1'>{[['list', List, 'Danh sách'], ['board', Columns3, 'Bảng trạng thái'], ['customers', Users, 'Khách hàng']].map(([value, Icon, label]) => <button key={value} onClick={() => { setView(value); setCustomer(null); setPage(1) }} title={label} className={`grid h-8 w-9 place-items-center ${view === value ? 'bg-black text-white' : ''}`}><Icon className='h-4 w-4' /></button>)}</div></div>
    <div className={view === 'list' ? 'overflow-hidden bg-white shadow-sm' : ''}>{loading ? <div className='h-80 animate-pulse bg-neutral-100' /> : error ? <div className='bg-white p-12 text-center text-red-600'><p>{error}</p><button onClick={load} className='mt-4 bg-black px-4 py-2 text-xs text-white'>Thử lại</button></div> : !rows.length ? <div className='bg-white p-12 text-center'><PackageSearch className='mx-auto h-12 w-12 text-neutral-400' /><p className='mt-3 font-black uppercase'>Không có dữ liệu phù hợp</p></div> : view === 'customers' ? <CustomerView customers={rows} onSelect={chooseCustomer} /> : view === 'board' ? <OrderBoard orders={rows} busyCode={busyCode} onUpdate={updateOrder} onDetail={setSelected} /> : <OrderTable orders={rows} busyCode={busyCode} onUpdate={updateOrder} onDetail={setSelected} />}</div>
    {pagination.totalPages > 1 && <div className='mt-6 flex items-center justify-center gap-4'><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className='bg-white p-2 disabled:opacity-30'><ChevronLeft /></button><span className='text-xs font-black'>Trang {page}/{pagination.totalPages}</span><button disabled={page >= pagination.totalPages} onClick={() => setPage((value) => value + 1)} className='bg-white p-2 disabled:opacity-30'><ChevronRight /></button></div>}
  </div><AdminOrderDrawer key={selected?.orderCode || 'none'} order={selected} busy={busy} onClose={() => !busy && setSelected(null)} onUpdate={updateSelected} onRefund={completeRefund} /></section>
}
