import { useEffect, useState } from 'react'
import { CheckCircle2, Clock3, XCircle } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { getOrder } from '../../services/paymentApi.js'
import useCartStore from '../../store/cartStore.js'
import { formatCurrency } from '../../utils/formatCurrency.js'

export default function PaymentResult() {
  const [params] = useSearchParams()
  const orderCode = params.get('orderCode')
  const [order, setOrder] = useState(null)
  const [error, setError] = useState(params.get('error') ? 'Không thể xác minh phản hồi từ VNPAY.' : '')
  const resetCart = useCartStore((state) => state.resetCart)

  useEffect(() => {
    if (!orderCode) return
    let active = true
    let timer
    const load = async () => {
      try {
        const data = await getOrder(orderCode)
        if (!active) return
        setOrder(data); setError('')
        if (data.paymentStatus === 'paid' || data.paymentStatus === 'cod_pending') resetCart()
        if (['pending_payment', 'payment_review'].includes(data.paymentStatus)) timer = setTimeout(load, 2500)
      } catch (requestError) {
        if (active) setError(requestError.response?.data?.message || 'Không thể tải trạng thái đơn hàng.')
      }
    }
    load()
    return () => { active = false; clearTimeout(timer) }
  }, [orderCode, resetCart])

  const successful = order?.paymentStatus === 'paid' || order?.paymentStatus === 'cod_pending'
  const pending = ['pending_payment', 'payment_review'].includes(order?.paymentStatus)
  const Icon = successful ? CheckCircle2 : pending ? Clock3 : XCircle
  const title = successful ? (order.paymentStatus === 'paid' ? 'Thanh toán thành công' : 'Đặt hàng thành công') : order?.paymentStatus === 'payment_review' ? 'Đang đối soát thanh toán' : pending ? 'Đang xác nhận thanh toán' : 'Thanh toán không thành công'

  return <main className="flex min-h-[70vh] items-center justify-center bg-gray-50 px-4">
    <section className="w-full max-w-lg bg-white p-8 text-center shadow-sm">
      <Icon className={`mx-auto h-14 w-14 ${successful ? 'text-emerald-600' : pending ? 'animate-pulse text-amber-500' : 'text-red-600'}`} />
      <h1 className="mt-4 text-2xl font-black uppercase">{error || title}</h1>
      {order && <div className="mt-6 space-y-2 bg-gray-50 p-5 text-sm">
        <div className="flex justify-between"><span>Mã đơn</span><strong>{order.orderCode}</strong></div>
        <div className="flex justify-between"><span>Tổng tiền</span><strong>{formatCurrency(order.totalAmount)}</strong></div>
        <div className="flex justify-between"><span>Phương thức</span><strong>{order.paymentMethod}</strong></div>
      </div>}
      {pending && <p className="mt-4 text-sm text-gray-500">Hệ thống đang đối chiếu trực tiếp với VNPAY. Không cần thanh toán lại; trang sẽ tự cập nhật.</p>}
      <Link to="/collections" className="mt-6 inline-block bg-black px-6 py-3 text-xs font-bold uppercase text-white">Tiếp tục mua sắm</Link>
    </section>
  </main>
}
