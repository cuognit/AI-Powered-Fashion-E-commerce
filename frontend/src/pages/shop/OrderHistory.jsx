import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, PackageOpen, RotateCcw, Search, Truck } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import CancelModal from '../../components/orders/CancelModal.jsx'
import OrderItemList from '../../components/orders/OrderItemList.jsx'
import OrderStatusBadge from '../../components/orders/OrderStatusBadge.jsx'
import { cancelOrder, confirmOrderReceived, listOrders, reorder } from '../../services/orderApi.js'
import { getReviewEligibility } from '../../services/reviewApi.js'
import useCartStore from '../../store/cartStore.js'
import { formatCurrency } from '../../utils/formatCurrency.js'
import { formatOrderDate, paymentStatusLabels, refundStatusLabels } from '../../utils/orderStatus.js'

const tabs = [
  ['', 'Tất cả'], ['pending', 'Chờ xác nhận'], ['processing', 'Chờ xử lý đơn'],
  ['ready_to_ship', 'Chờ vận chuyển'], ['shipped', 'Đang giao'], ['completed', 'Đã giao'], ['canceled', 'Đã hủy'],
]
const messageOf = (error) => error.response?.data?.message || 'Không thể xử lý yêu cầu'

export default function OrderHistory() {
  const navigate = useNavigate()
  const refreshCart = useCartStore((state) => state.fetchCart)
  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyCode, setBusyCode] = useState('')
  const [cancelTarget, setCancelTarget] = useState(null)
  const [reviewMap, setReviewMap] = useState({})

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const result = await listOrders({ page, limit: 10, status: status || undefined, search: search || undefined })
      const nextOrders = result.data || []
      setOrders(nextOrders); setPagination(result.pagination || { page: 1, totalPages: 1, total: 0 })
      if (status === 'completed' || !status) {
        const productIds = [...new Set(nextOrders.filter((order) => order.status === 'completed').flatMap((order) => order.items || []).map((item) => item.productId).filter(Boolean))]
        const entries = await Promise.all(productIds.map(async (productId) => { try { const { data } = await getReviewEligibility(productId); return [productId, data.data?.variants || []] } catch { return [productId, []] } }))
        const nextMap = {}
        entries.forEach(([productId, variants]) => variants.forEach((variant) => { if (variant.review) nextMap[`${productId}:${variant.variantSku}`] = variant.review }))
        setReviewMap(nextMap)
      } else setReviewMap({})
    } catch (requestError) { setError(messageOf(requestError)) }
    finally { setLoading(false) }
  }, [page, search, status])
  useEffect(() => { load() }, [load])

  const handleCancel = async (payload) => {
    setBusyCode(cancelTarget.orderCode)
    try { await cancelOrder(cancelTarget.orderCode, payload); toast.success('Đã hủy đơn hàng'); setCancelTarget(null); await load() }
    catch (requestError) { toast.error(messageOf(requestError)) }
    finally { setBusyCode('') }
  }

  const handleReceived = async (orderCode) => {
    if (!window.confirm('Bạn xác nhận đã nhận được đơn hàng này?')) return
    setBusyCode(orderCode)
    try { await confirmOrderReceived(orderCode); toast.success('Đã xác nhận nhận hàng'); await load() }
    catch (requestError) { toast.error(messageOf(requestError)) }
    finally { setBusyCode('') }
  }

  const handleReorder = async (orderCode) => {
    setBusyCode(orderCode)
    try {
      const result = await reorder(orderCode)
      if (!result.addedItems?.length) return toast.error('Không còn sản phẩm nào có thể thêm vào giỏ')
      await refreshCart(true)
      toast.success(result.skippedItems?.length ? 'Đã thêm các sản phẩm còn hàng vào giỏ' : 'Đã thêm toàn bộ đơn vào giỏ')
      navigate('/cart')
    } catch (requestError) { toast.error(messageOf(requestError)) }
    finally { setBusyCode('') }
  }

  return <main className='min-h-[75vh] bg-[#f4f2ed] py-10'><div className='mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8'>
    <div className='flex flex-col justify-between gap-5 border-b border-black pb-6 sm:flex-row sm:items-end'><div><p className='text-xs font-bold uppercase tracking-[.25em] text-neutral-500'>Tài khoản</p><h1 className='mt-2 text-3xl font-black uppercase sm:text-5xl'>Đơn hàng của tôi</h1><p className='mt-2 text-sm text-neutral-600'>{pagination.total} đơn hàng đã đặt</p></div>
      <form onSubmit={(event) => { event.preventDefault(); setPage(1); setSearch(searchInput.trim()) }} className='flex border border-neutral-300 bg-white'><Search className='ml-3 mt-3 h-4 w-4 text-neutral-400' /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder='Tìm mã đơn...' className='w-52 bg-transparent px-3 py-3 text-sm outline-none' /><button className='bg-black px-4 text-xs font-black uppercase text-white'>Tìm</button></form>
    </div>
    <div className='my-6 flex gap-2 overflow-x-auto pb-2'>{tabs.map(([value, label]) => <button key={value} onClick={() => { setStatus(value); setPage(1) }} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-black uppercase ${status === value ? 'bg-black text-white' : 'border border-neutral-300 bg-white'}`}>{label}</button>)}</div>
    {loading ? <div className='h-56 animate-pulse bg-white' /> : error ? <div className='bg-white p-10 text-center'><AlertCircle className='mx-auto' /><p className='mt-3'>{error}</p><button onClick={load} className='mt-4 bg-black px-5 py-3 text-xs font-black uppercase text-white'>Thử lại</button></div> : !orders.length ? <div className='bg-white p-12 text-center'><PackageOpen className='mx-auto h-12 w-12 text-neutral-400' /><h2 className='mt-4 text-xl font-black uppercase'>Chưa có đơn hàng</h2><Link to='/collections' className='mt-5 inline-block bg-black px-6 py-3 text-xs font-black uppercase text-white'>Bắt đầu mua sắm</Link></div> : <div className='space-y-5'>{orders.map((order) => <article key={order.orderCode} className='bg-white p-5 shadow-sm sm:p-7'>
      <div className='flex flex-col justify-between gap-3 border-b pb-4 sm:flex-row sm:items-center'><div><p className='font-mono text-sm font-black'>{order.orderCode}</p><p className='mt-1 text-xs text-neutral-500'>Đặt ngày {formatOrderDate(order.createdAt)} · {order.itemCount} sản phẩm</p></div><OrderStatusBadge status={order.status} /></div>
      <div className='grid gap-6 py-5 md:grid-cols-[1fr_220px]'><OrderItemList items={order.items} compact={order.status !== 'completed'} /><div className='bg-neutral-50 p-4 text-xs'><div className='flex justify-between'><span>Thanh toán</span><b>{paymentStatusLabels[order.paymentStatus]}</b></div>{order.refund?.status !== 'none' && <div className='mt-2 flex justify-between text-amber-700'><span>Hoàn tiền</span><b>{refundStatusLabels[order.refund.status]}</b></div>}<div className='mt-3 flex justify-between border-t pt-3 text-sm'><span>Tổng cộng</span><b>{formatCurrency(order.totalAmount)}</b></div></div></div>
      <div className='flex flex-wrap justify-end gap-2 border-t pt-4'>
        <button disabled={busyCode === order.orderCode} onClick={() => handleReorder(order.orderCode)} className='flex items-center gap-2 border border-neutral-300 bg-white px-4 py-2.5 text-xs font-black uppercase transition-all duration-200 hover:border-black hover:bg-neutral-50 hover:shadow-sm active:scale-95 disabled:opacity-50'><RotateCcw className='h-4 w-4' />Mua lại</button>
        {order.status === 'completed' && order.items.map((item) => { const reviewed = reviewMap[`${item.productId}:${item.variantSku}`]; return <Link key={`review-${item.productId}-${item.variantSku}`} to={`/products/${item.productId}?reviewSku=${encodeURIComponent(item.variantSku || '')}`} className='border border-amber-600 bg-amber-50/50 px-4 py-2.5 text-xs font-black uppercase text-amber-700 transition-all duration-200 hover:bg-amber-600 hover:text-white hover:shadow-md active:scale-95'>{reviewed ? 'Sửa đánh giá' : 'Đánh giá'}</Link> })}
        {['pending', 'processing'].includes(order.status) && <button onClick={() => setCancelTarget(order)} className='border border-red-200 bg-red-50/30 px-4 py-2.5 text-xs font-black uppercase text-red-600 transition-all duration-200 hover:bg-red-600 hover:text-white hover:shadow-sm active:scale-95'>Hủy đơn</button>}
        {order.status === 'shipped' && <button disabled={busyCode === order.orderCode} onClick={() => handleReceived(order.orderCode)} className='flex items-center gap-2 bg-emerald-700 px-4 py-2.5 text-xs font-black uppercase text-white transition-all duration-200 hover:bg-emerald-800 hover:shadow-md active:scale-95 disabled:opacity-50'><CheckCircle2 className='h-4 w-4' />Đã nhận hàng</button>}
        <Link to={`/track-order?orderCode=${encodeURIComponent(order.orderCode)}`} className='flex items-center gap-2 border border-black bg-black px-4 py-2.5 text-xs font-black uppercase text-white transition-all duration-200 hover:bg-neutral-800 hover:shadow-md hover:scale-[1.02] active:scale-95'><Truck className='h-4 w-4' />Theo dõi</Link>
      </div>
    </article>)}</div>}
    {pagination.totalPages > 1 && <div className='mt-8 flex items-center justify-center gap-4'><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className='rounded-full border bg-white p-2 disabled:opacity-30'><ChevronLeft /></button><span className='text-xs font-black uppercase'>Trang {pagination.page} / {pagination.totalPages}</span><button disabled={page >= pagination.totalPages} onClick={() => setPage((value) => value + 1)} className='rounded-full border bg-white p-2 disabled:opacity-30'><ChevronRight /></button></div>}
  </div><CancelModal key={cancelTarget?.orderCode || 'none'} order={cancelTarget} busy={Boolean(busyCode)} onClose={() => !busyCode && setCancelTarget(null)} onConfirm={handleCancel} /></main>
}