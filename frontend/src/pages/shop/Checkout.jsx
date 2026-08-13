import { useEffect, useState } from 'react'
import { ArrowRight, Save, ShieldCheck, Truck, WalletCards } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth.js'
import { getProfile, updateProfile } from '../../services/authApi.js'
import useCartStore from '../../store/cartStore.js'
import { createCodOrder, createVnpayPayment } from '../../services/paymentApi.js'
import { formatCurrency } from '../../utils/formatCurrency.js'

const fields = [
  ['fullName', 'Họ và tên', 'Nguyễn Văn A'], ['phone', 'Số điện thoại', '0912345678'],
  ['address', 'Địa chỉ', 'Số nhà, tên đường'], ['city', 'Tỉnh / Thành phố', 'TP. Hồ Chí Minh'],
  ['postalCode', 'Mã bưu chính', '700000'], ['notes', 'Ghi chú', 'Giao giờ hành chính'],
]

const profileSyncLabels = {
  loading: 'Đang lấy hồ sơ',
  loaded: 'Đã điền từ hồ sơ',
  error: 'Không thể tự điền, vui lòng nhập thủ công',
}

export default function Checkout() {
  const navigate = useNavigate()
  const store = useCartStore()
  const { user, updateUser } = useAuth()
  const [couponInput, setCouponInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSync, setProfileSync] = useState('loading')
  const subtotal = store.getSubtotal()
  const discount = store.getDiscountAmount()
  const total = store.getTotal()

  useEffect(() => {
    let active = true
    store.hydrateShippingDetails(user || {})
    getProfile()
      .then(({ data }) => {
        if (!active) return
        const profile = data?.user || {}
        store.hydrateShippingDetails(profile)
        updateUser(profile)
        setProfileSync('loaded')
      })
      .catch(() => { if (active) setProfileSync('error') })
    return () => { active = false }
  }, [])

  const applyCoupon = (event) => {
    event.preventDefault()
    const result = store.applyCoupon(couponInput)
    result.success ? toast.success(result.message) : toast.error(result.message)
    if (result.success) setCouponInput('')
  }

  const checkoutPayload = () => ({
    ...store.shippingDetails,
    coupon: store.appliedCoupon || undefined,
  })

  const saveCheckoutProfile = async () => {
    const { fullName, phone, address } = store.shippingDetails
    if (fullName.trim().length < 2) {
      toast.error('Vui lòng nhập họ tên trước khi cập nhật hồ sơ')
      return
    }
    setSavingProfile(true)
    try {
      const { data } = await updateProfile({ name: fullName, phone, address })
      if (data?.user) updateUser(data.user)
      setProfileSync('loaded')
      toast.success('Đã cập nhật thông tin vào hồ sơ')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật hồ sơ')
    } finally { setSavingProfile(false) }
  }

  const placeOrder = async () => {
    if (!store.shippingDetails.fullName.trim() || !store.shippingDetails.phone.trim() || !store.shippingDetails.address.trim() || !store.shippingDetails.city.trim()) {
      toast.error('Vui lòng nhập đầy đủ thông tin giao hàng')
      return
    }
    setSubmitting(true)
    try {
      if (store.paymentMethod === 'vnpay') {
        const result = await createVnpayPayment(checkoutPayload())
        window.location.assign(result.paymentUrl)
        return
      }
      const result = await createCodOrder(checkoutPayload())
      store.resetCart()
      navigate(`/payment/result?orderCode=${encodeURIComponent(result.orderCode)}`)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể tạo đơn hàng')
    } finally { setSubmitting(false) }
  }

  return (
    <main className="min-h-screen bg-[#f8f8f8] py-10 text-gray-900">
      <div className="mx-auto grid max-w-[1360px] gap-8 px-4 sm:px-6 lg:px-8 lg:grid-cols-[1fr_380px]">
        <section className="space-y-8">
          <h1 className="border-b border-black pb-3 text-3xl font-black uppercase">Thanh toán</h1>
          <div className="bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-black uppercase tracking-wider">Thông tin giao hàng</h2>
              <span className={profileSync === 'loaded' ? 'text-[10px] font-bold text-emerald-700' : profileSync === 'error' ? 'text-[10px] font-bold text-amber-700' : 'text-[10px] font-bold uppercase text-neutral-400'}>
                {profileSyncLabels[profileSync]}
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map(([name, label, placeholder]) => (
                <label key={name} className={name === 'address' || name === 'notes' ? 'sm:col-span-2' : ''}>
                  <span className="mb-1.5 block text-[11px] font-bold uppercase">{label}{!['postalCode', 'notes'].includes(name) && ' *'}</span>
                  <input value={store.shippingDetails[name]} onChange={(e) => store.setShippingDetails(name, e.target.value)} placeholder={placeholder}
                    className="w-full border border-gray-200 bg-gray-50 px-3.5 py-3 text-sm outline-none focus:border-black focus:bg-white" />
                </label>
              ))}
            </div>
            <div className="mt-5 flex flex-col items-start justify-between gap-3 border-t border-neutral-200 pt-4 sm:flex-row sm:items-center">
              <p className="text-xs leading-5 text-neutral-500">Lưu họ tên, số điện thoại và địa chỉ này làm thông tin mặc định cho lần thanh toán sau.</p>
              <button type="button" onClick={saveCheckoutProfile} disabled={savingProfile || profileSync === 'loading'} className="flex shrink-0 items-center gap-2 border border-black bg-white px-4 py-2.5 text-[10px] font-black uppercase disabled:opacity-40">
                <Save className="h-4 w-4" />{savingProfile ? 'Đang cập nhật...' : 'Cập nhật vào hồ sơ'}
              </button>
            </div>
          </div>
          <div className="bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-sm font-black uppercase tracking-wider">Phương thức thanh toán</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => store.setPaymentMethod('vnpay')} className={`flex items-center gap-3 border p-4 text-left ${store.paymentMethod === 'vnpay' ? 'border-black bg-black text-white' : 'border-gray-200'}`}>
                <WalletCards /><span><strong className="block text-sm">VNPAY</strong><small>Cổng thanh toán bảo mật</small></span>
              </button>
              <button type="button" onClick={() => store.setPaymentMethod('cod')} className={`flex items-center gap-3 border p-4 text-left ${store.paymentMethod === 'cod' ? 'border-black bg-black text-white' : 'border-gray-200'}`}>
                <Truck /><span><strong className="block text-sm">Thanh toán khi nhận hàng</strong><small>COD</small></span>
              </button>
            </div>
            {store.paymentMethod === 'vnpay' && <p className="mt-4 flex items-center gap-2 text-xs text-gray-600"><ShieldCheck className="h-4 w-4 text-emerald-600" />Bạn sẽ được chuyển tới VNPAY. Website không lưu thông tin thẻ.</p>}
          </div>
        </section>

        <aside className="h-fit bg-[#efefef] p-6 lg:sticky lg:top-24">
          <h2 className="border-b border-gray-300 pb-3 text-lg font-black uppercase">Đơn hàng</h2>
          <div className="my-4 max-h-60 space-y-3 overflow-auto">
            {store.items.map((item) => <div key={item.id} className="flex justify-between gap-3 text-xs"><span>{item.name} × {item.quantity}<small className="block text-gray-500">{item.color} / {item.size}</small></span><strong>{formatCurrency(item.price * item.quantity)}</strong></div>)}
          </div>
          <form onSubmit={applyCoupon} className="mb-5 flex gap-2">
            <input value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="Mã giảm giá" className="min-w-0 flex-1 border px-3 py-2 text-xs uppercase" />
            <button className="bg-black px-4 text-xs font-bold text-white">ÁP DỤNG</button>
          </form>
          {store.appliedCoupon && <button onClick={store.removeCoupon} className="mb-4 text-xs text-emerald-700 underline">{store.appliedCoupon} ({store.discountPercent}%) — bỏ mã</button>}
          <div className="space-y-2 border-t border-gray-300 pt-4 text-sm">
            <div className="flex justify-between"><span>Tạm tính</span><strong>{formatCurrency(subtotal)}</strong></div>
            {discount > 0 && <div className="flex justify-between text-emerald-700"><span>Giảm giá</span><strong>-{formatCurrency(discount)}</strong></div>}
            <div className="flex justify-between"><span>Phí giao hàng</span><strong>{formatCurrency(store.shippingCost)}</strong></div>
            <div className="flex justify-between border-t border-gray-300 pt-3 text-xl font-black"><span>Tổng</span><span>{formatCurrency(total)}</span></div>
          </div>
          <button disabled={submitting} onClick={placeOrder} className="mt-6 flex w-full items-center justify-center gap-2 bg-black py-4 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50">
            {submitting ? 'Đang xử lý...' : store.paymentMethod === 'vnpay' ? 'Thanh toán qua VNPAY' : 'Đặt hàng COD'} <ArrowRight className="h-4 w-4" />
          </button>
          <p className="mt-3 text-center text-[10px] text-gray-500">Số tiền cuối cùng được xác nhận tại máy chủ.</p>
        </aside>
      </div>
    </main>
  )
}
