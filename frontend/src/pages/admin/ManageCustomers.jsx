import { ChevronLeft, ChevronRight, FilterX, RefreshCw, Search, UserRound, Users } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import AdminCustomerDrawer from '../../components/admin/customers/AdminCustomerDrawer.jsx'
import AdminOrderDrawer from '../../components/admin/orders/AdminOrderDrawer.jsx'
import { listAdminCustomers } from '../../services/adminCustomerApi.js'
import { formatCurrency } from '../../utils/formatCurrency.js'
import { formatOrderDate } from '../../utils/orderStatus.js'

const emptyPagination = { page: 1, totalPages: 1, total: 0 }
const sortOptions = [
  ['newest', 'Mới đăng ký'], ['oldest', 'Đăng ký lâu nhất'], ['name', 'Tên A–Z'],
  ['order_count', 'Nhiều đơn nhất'], ['total_spent', 'Chi tiêu cao nhất'],
]
const messageOf = (error) => error.response?.data?.message || 'Không thể tải danh sách khách hàng'

function CustomerAvatar({ customer }) {
  const label = customer.name || customer.email || 'Khách hàng'
  return <span className='grid h-11 w-11 shrink-0 place-items-center bg-black font-black text-white'>{label.charAt(0).toUpperCase()}</span>
}

function CustomerCards({ customers, onSelect }) {
  return <div className='grid gap-4 sm:grid-cols-2 lg:hidden'>{customers.map((customer) => <button type='button' key={customer.id} onClick={() => onSelect(customer)} className='bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg'><div className='flex items-start gap-3'><CustomerAvatar customer={customer} /><div className='min-w-0'><h3 className='truncate font-black'>{customer.name || 'Chưa cập nhật tên'}</h3><p className='truncate text-xs text-neutral-500'>{customer.email}</p><p className='mt-1 text-xs text-neutral-500'>{customer.phone || 'Chưa có số điện thoại'}</p></div></div><div className='mt-5 grid grid-cols-2 gap-3 border-t pt-4 text-xs'><div><span className='text-neutral-500'>Tổng đơn</span><b className='block text-base'>{customer.orderCount || 0}</b></div><div><span className='text-neutral-500'>Đang xử lý</span><b className='block text-base'>{customer.activeOrders || 0}</b></div><div><span className='text-neutral-500'>Đã giao</span><b className='block text-base'>{customer.completedOrders || 0}</b></div><div><span className='text-neutral-500'>Tổng chi tiêu</span><b className='block'>{formatCurrency(customer.totalSpent || 0)}</b></div></div><p className='mt-4 text-[10px] font-bold uppercase text-neutral-400'>Mua gần nhất: {formatOrderDate(customer.latestOrderAt)}</p></button>)}</div>
}

function CustomerTable({ customers, onSelect }) {
  return <div className='hidden overflow-x-auto bg-white shadow-sm lg:block'><table className='w-full min-w-[1050px] text-left text-sm'><thead className='border-b bg-neutral-50 text-[10px] font-black uppercase tracking-[0.08em]'><tr><th className='p-4'>Khách hàng</th><th className='p-4'>Điện thoại</th><th className='p-4'>Ngày tham gia</th><th className='p-4'>Đơn hàng</th><th className='p-4'>Đang xử lý</th><th className='p-4'>Tổng chi tiêu</th><th className='p-4'>Mua gần nhất</th></tr></thead><tbody className='divide-y'>{customers.map((customer) => <tr key={customer.id} onClick={() => onSelect(customer)} className='cursor-pointer transition hover:bg-neutral-50' tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(customer) } }}><td className='p-4'><div className='flex items-center gap-3'><CustomerAvatar customer={customer} /><div className='min-w-0'><b className='block max-w-52 truncate'>{customer.name || 'Chưa cập nhật tên'}</b><p className='max-w-52 truncate text-xs text-neutral-500'>{customer.email}</p></div></div></td><td className='p-4 text-xs'>{customer.phone || '—'}</td><td className='p-4 text-xs'>{formatOrderDate(customer.createdAt)}</td><td className='p-4'><b>{customer.orderCount || 0}</b><p className='text-[10px] text-neutral-500'>{customer.completedOrders || 0} đã giao</p></td><td className='p-4 font-bold'>{customer.activeOrders || 0}</td><td className='p-4 font-black'>{formatCurrency(customer.totalSpent || 0)}</td><td className='p-4 text-xs'>{formatOrderDate(customer.latestOrderAt)}</td></tr>)}</tbody></table></div>
}

export default function ManageCustomers() {
  const [customers, setCustomers] = useState([])
  const [pagination, setPagination] = useState(emptyPagination)
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState('newest')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const result = await listAdminCustomers({ page, limit: 15, sort, search: search || undefined })
      setCustomers(result.data || [])
      setPagination(result.pagination || emptyPagination)
    } catch (requestError) { setError(messageOf(requestError)) }
    finally { setLoading(false) }
  }, [page, search, sort])

  useEffect(() => { load() }, [load])

  const resetFilters = () => { setSearchInput(''); setSearch(''); setSort('newest'); setPage(1) }

  return <section className='px-4 py-8 lg:px-8'><div className='mx-auto max-w-[1360px]'>
    <header className='flex flex-col justify-between gap-5 border-b border-black pb-6 sm:flex-row sm:items-end'><div><p className='text-xs font-bold uppercase tracking-[0.25em] text-neutral-500'>Quan hệ khách hàng</p><h1 className='mt-2 text-3xl font-black uppercase sm:text-5xl'>Quản lý khách hàng</h1><p className='mt-3 max-w-2xl text-sm text-neutral-600'>Tra cứu hồ sơ, mức độ hoạt động và lịch sử mua sắm của khách hàng.</p></div><div className='flex min-w-40 items-center gap-3 bg-black px-5 py-4 text-white'><Users className='h-6 w-6' /><div><p className='text-[9px] font-bold uppercase text-neutral-400'>Tổng khách hàng</p><b className='text-xl'>{pagination.total}</b></div></div></header>

    <div className='mt-5 bg-white p-4'><div className='flex flex-col gap-3 lg:flex-row'><form onSubmit={(event) => { event.preventDefault(); setSearch(searchInput.trim()); setPage(1) }} className='flex min-w-0 flex-1 border'><Search className='ml-3 mt-3 h-4 w-4 shrink-0' /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} maxLength={100} placeholder='Tìm theo tên, email hoặc số điện thoại...' className='min-w-0 flex-1 px-3 py-3 text-sm outline-none' /><button className='bg-black px-5 text-[10px] font-black uppercase text-white'>Tìm</button></form><select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1) }} className='border bg-white p-3 text-xs font-bold' aria-label='Sắp xếp khách hàng'>{sortOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><div className='mt-3 flex items-center'><button type='button' onClick={resetFilters} className='flex items-center gap-2 p-2 text-[10px] font-black uppercase text-neutral-500'><FilterX className='h-4 w-4' />Xóa bộ lọc</button><button type='button' onClick={load} disabled={loading} className='ml-auto border p-2' aria-label='Tải lại danh sách'><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button></div></div>

    <div className='my-5 flex items-center justify-between'><p className='text-xs font-bold'>{pagination.total} khách hàng phù hợp</p><p className='hidden text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-400 sm:block'>Chọn một khách hàng để xem chi tiết</p></div>
    {loading ? <div className='h-80 animate-pulse bg-white' /> : error ? <div className='bg-white p-12 text-center text-red-600'><p>{error}</p><button type='button' onClick={load} className='mt-4 bg-black px-5 py-2.5 text-[10px] font-black uppercase text-white'>Thử lại</button></div> : !customers.length ? <div className='bg-white p-12 text-center'><UserRound className='mx-auto h-12 w-12 text-neutral-300' /><p className='mt-3 font-black uppercase'>Không tìm thấy khách hàng</p><p className='mt-2 text-xs text-neutral-500'>Thử thay đổi từ khóa hoặc xóa bộ lọc.</p></div> : <><CustomerCards customers={customers} onSelect={setSelected} /><CustomerTable customers={customers} onSelect={setSelected} /></>}
    {pagination.totalPages > 1 && <div className='mt-6 flex items-center justify-center gap-4'><button type='button' disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className='grid h-10 w-10 place-items-center bg-white disabled:opacity-30' aria-label='Trang trước'><ChevronLeft className='h-5 w-5' /></button><span className='text-xs font-black'>Trang {pagination.page}/{pagination.totalPages}</span><button type='button' disabled={page >= pagination.totalPages || loading} onClick={() => setPage((value) => value + 1)} className='grid h-10 w-10 place-items-center bg-white disabled:opacity-30' aria-label='Trang sau'><ChevronRight className='h-5 w-5' /></button></div>}
  </div>{selected && <AdminCustomerDrawer key={selected.id} customer={selected} onClose={() => { setSelected(null); setSelectedOrder(null) }} onOrderSelect={setSelectedOrder} escapeDisabled={Boolean(selectedOrder)} />}{selectedOrder && <AdminOrderDrawer key={selectedOrder.orderCode} order={selectedOrder} onClose={() => setSelectedOrder(null)} readOnly />}</section>
}
