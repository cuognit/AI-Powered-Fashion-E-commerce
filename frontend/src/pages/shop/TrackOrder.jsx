import { AlertCircle, ArrowLeft, CalendarDays, Copy, MapPin, PackageSearch, Phone, RefreshCw, Truck, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import CancelModal from '../../components/orders/CancelModal.jsx'
import OrderItemList from '../../components/orders/OrderItemList.jsx'
import OrderStatusBadge from '../../components/orders/OrderStatusBadge.jsx'
import OrderTimeline from '../../components/orders/OrderTimeline.jsx'
import { cancelOrder, getOrderDetail, listOrders } from '../../services/orderApi.js'
import { formatCurrency } from '../../utils/formatCurrency.js'
import { cancelReasonLabels, formatOrderDate, paymentStatusLabels, refundStatusLabels } from '../../utils/orderStatus.js'

const messageOf = (error) => error.response?.data?.message || 'Không thể tải thông tin đơn hàng'

export default function TrackOrder() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyCancel, setBusyCancel] = useState(false)
  const [cancelTarget, setCancelTarget] = useState(null)
  const selectedCode = params.get('orderCode') || ''

  useEffect(() => {
    let active = true
    if (selectedCode) return undefined
    listOrders({ page: 1, limit: 50 }).then((result) => {
      if (!active) return
      const rows = result.data || []
      if (rows.length) {
        const preferred = rows.find((item) => !['completed', 'canceled'].includes(item.status)) || rows[0]
        setParams({ orderCode: preferred.orderCode }, { replace: true })
      } else setLoading(false)
    }).catch((requestError) => { if (active) { setError(messageOf(requestError)); setLoading(false) } })
    return () => { active = false }
  }, [selectedCode, setParams])

  const load = useCallback(async (silent = false) => {
    if (!selectedCode) return
    if (!silent) setLoading(true)
    try { setOrder(await getOrderDetail(selectedCode)); setError('') }
    catch (requestError) { setError(messageOf(requestError)); if (!silent) setOrder(null) }
    finally { if (!silent) setLoading(false) }
  }, [selectedCode])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (!order || ['completed', 'canceled'].includes(order.status)) return undefined
    const timer = setInterval(() => load(true), 30_000)
    return () => clearInterval(timer)
  }, [load, order])

  const copyTracking = async () => {
    await navigator.clipboard.writeText(order.shipment.trackingCode)
    toast.success('Đã sao chép mã vận đơn')
  }

  const handleCancel = async (payload) => {
    setBusyCancel(true)
    try {
      await cancelOrder(cancelTarget.orderCode, payload)
      toast.success('Đã hủy đơn hàng')
      setCancelTarget(null)
      await load(true)
    } catch (requestError) { toast.error(messageOf(requestError)) }
    finally { setBusyCancel(false) }
  }

  return <main className='min-h-[75vh] bg-[#f4f2ed] py-10'>
    <div className='mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8'>
      <button onClick={() => navigate(-1)} className='flex items-center gap-2 text-xs font-black uppercase tracking-wider text-neutral-600 transition hover:text-black'><ArrowLeft className='h-4 w-4' />Trở về</button>
      <div className='mt-6 flex flex-col justify-between gap-5 border-b border-black pb-6 sm:flex-row sm:items-end'>
        <div><p className='text-xs font-bold uppercase tracking-[.25em] text-neutral-500'>Hành trình giao hàng</p><h1 className='mt-2 text-3xl font-black uppercase sm:text-5xl'>Theo dõi đơn hàng</h1></div>
      </div>

      {loading ? <div className='mt-8 h-96 animate-pulse rounded-none bg-white' />
        : error ? <div className='mt-8 rounded-none bg-white p-12 text-center'><AlertCircle className='mx-auto h-12 w-12 text-red-500' /><p className='mt-4'>{error}</p><button onClick={() => load()} className='mt-5 bg-black px-5 py-3 text-xs font-black uppercase text-white'>Thử lại</button></div>
          : !order ? <div className='mt-8 rounded-none bg-white p-12 text-center'><PackageSearch className='mx-auto h-14 w-14 text-neutral-400' /><h2 className='mt-4 text-xl font-black uppercase'>Bạn chưa có đơn hàng</h2><Link to='/collections' className='mt-5 inline-block bg-black px-6 py-3 text-xs font-black uppercase text-white'>Mua sắm ngay</Link></div>
            : <div className='mt-8 space-y-6'>
              <section className='rounded-none bg-white p-6 shadow-sm sm:p-8'>
                <div className='mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-center'><div><p className='font-mono text-lg font-black'>{order.orderCode}</p><p className='mt-1 text-xs text-neutral-500'>Cập nhật gần nhất {formatOrderDate(order.updatedAt, true)}</p></div><div className='flex items-center gap-3'><OrderStatusBadge status={order.status} />{['pending', 'processing'].includes(order.status) && <button onClick={() => setCancelTarget(order)} className='flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-xs font-black uppercase text-red-600'><X className='h-4 w-4' />Hủy đơn</button>}<button onClick={() => load()} className='rounded-full border p-2' title='Làm mới'><RefreshCw className='h-4 w-4' /></button></div></div>
                <OrderTimeline order={order} />
              </section>

              {order.shipment?.trackingCode && <section className='grid gap-4 rounded-none bg-black p-6 text-white sm:grid-cols-3 sm:p-8'>
                <div><p className='text-[10px] font-bold uppercase tracking-widest text-neutral-400'>Đơn vị vận chuyển</p><p className='mt-2 flex items-center gap-2 font-black uppercase'><Truck className='h-5 w-5' />{order.shipment.carrier}</p></div>
                <div><p className='text-[10px] font-bold uppercase tracking-widest text-neutral-400'>Mã vận đơn</p><button onClick={copyTracking} className='mt-2 flex items-center gap-2 font-mono font-bold'>{order.shipment.trackingCode}<Copy className='h-4 w-4' /></button></div>
                <div><p className='text-[10px] font-bold uppercase tracking-widest text-neutral-400'>Giao dự kiến</p><p className='mt-2 flex items-center gap-2 font-bold'><CalendarDays className='h-5 w-5' />{formatOrderDate(order.shipment.estimatedDeliveryAt)}</p></div>
              </section>}

              <div className='grid gap-6 lg:grid-cols-[1.3fr_.7fr]'>
                <section className='rounded-none bg-white p-6 shadow-sm sm:p-8'><h2 className='mb-5 text-sm font-black uppercase tracking-widest'>Sản phẩm</h2><OrderItemList items={order.items} /></section>
                <div className='space-y-6'>
                  <section className='rounded-none bg-white p-6 shadow-sm'><h2 className='text-sm font-black uppercase tracking-widest'>Giao đến</h2><div className='mt-5 space-y-3 text-sm text-neutral-700'><p className='flex gap-3'><MapPin className='h-5 w-5 shrink-0' />{order.shippingAddress}</p><p className='flex gap-3'><Phone className='h-5 w-5 shrink-0' />{order.phoneNumber}</p>{order.note && <p className='rounded-none bg-neutral-50 p-3 text-xs'>Ghi chú: {order.note}</p>}</div></section>
                  <section className='rounded-none bg-white p-6 shadow-sm'><h2 className='text-sm font-black uppercase tracking-widest'>Thanh toán</h2><div className='mt-5 space-y-3 text-sm'><div className='flex justify-between'><span>Phương thức</span><b>{order.paymentMethod}</b></div><div className='flex justify-between'><span>Trạng thái</span><b>{paymentStatusLabels[order.paymentStatus]}</b></div>{order.refund?.status !== 'none' && <div className='flex justify-between text-amber-700'><span>Hoàn tiền</span><b>{refundStatusLabels[order.refund.status]}</b></div>}<div className='flex justify-between border-t pt-3 text-base'><span>Tổng cộng</span><b>{formatCurrency(order.totalAmount)}</b></div></div></section>
                  {order.status === 'canceled' && <section className='rounded-none border border-red-200 bg-red-50 p-6 text-sm text-red-800'><h2 className='font-black uppercase'>Thông tin hủy</h2><p className='mt-3'>{cancelReasonLabels[order.cancellation?.reasonCode] || 'Đơn hàng đã bị hủy'}</p>{order.cancellation?.note && <p className='mt-2 text-xs'>{order.cancellation.note}</p>}</section>}
                </div>
              </div>
            </div>}
    </div>
    <CancelModal key={cancelTarget?.orderCode || 'none'} order={cancelTarget} busy={busyCancel} onClose={() => !busyCancel && setCancelTarget(null)} onConfirm={handleCancel} />
  </main>
}
