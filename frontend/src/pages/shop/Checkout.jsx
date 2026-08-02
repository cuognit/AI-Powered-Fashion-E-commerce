import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CreditCard,
  QrCode,
  Truck,
  Copy,
  Check,
  ShieldCheck,
  Tag,
  ArrowRight,
  Sparkles,
  Lock,
} from 'lucide-react'
import toast from 'react-hot-toast'
import useCartStore from '../../store/cartStore'
import { CheckoutSuccessModal } from '../../components/CheckoutModals'

export default function Checkout() {
  const {
    items,
    getSubtotal,
    getDiscountAmount,
    getTotal,
    shippingCost,
    aiInsuranceCost,
    appliedCoupon,
    discountPercent,
    applyCoupon,
    removeCoupon,
    paymentMethod,
    setPaymentMethod,
    shippingDetails,
    setShippingDetails,
    clearCart,
  } = useCartStore()

  const [couponInput, setCouponInput] = useState('')
  const [copiedField, setCopiedField] = useState(null)
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
  const [completedOrderData, setCompletedOrderData] = useState(null)

  // Card form state
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: '',
  })

  const subtotal = getSubtotal()
  const discountAmount = getDiscountAmount()
  const total = getTotal()
  const totalItemCount = items.reduce((acc, item) => acc + item.quantity, 0)

  const demoBankInfo = {
    bankName: 'MB BANK (Ngan Hang Quan Doi)',
    accountNumber: '098888888888',
    accountName: 'AESTHETIX FASHION CORP',
    memo: `AEST-${Math.floor(10000 + Math.random() * 90000)}`,
  }

  const handleInputChange = (field, value) => {
    setShippingDetails(field, value)
  }

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    toast.success(`Copied ${fieldName} to clipboard!`)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleApplyCoupon = (e) => {
    e.preventDefault()
    if (!couponInput.trim()) return
    const res = applyCoupon(couponInput)
    if (res.success) {
      toast.success(res.message)
      setCouponInput('')
    } else {
      toast.error(res.message)
    }
  }

  const handlePlaceOrder = () => {
    if (items.length === 0) {
      toast.error('Your bag is currently empty!')
      return
    }

    const paymentMethodNames = {
      cod: 'Cash On Delivery (COD)',
      qr: 'VietQR Banking Transfer',
      card: 'Credit / Debit Card (Visa/Mastercard)',
    }

    const orderData = {
      orderId: demoBankInfo.memo,
      fullName: shippingDetails.fullName.trim() || 'ALEXANDER VOGUE',
      phone: shippingDetails.phone.trim() || '+1 (555) 000-0000',
      address: shippingDetails.address.trim() || 'STREET, BUILDING, APARTMENT NO.',
      city: shippingDetails.city.trim() || 'NEW YORK',
      postalCode: shippingDetails.postalCode.trim() || '10001',
      paymentMethodName: paymentMethodNames[paymentMethod],
      appliedCoupon,
      discountAmount,
      total,
    }

    setCompletedOrderData(orderData)
    toast.success('Order processed successfully!')
    setIsSuccessModalOpen(true)
  }

  const handleModalClose = () => {
    setIsSuccessModalOpen(false)
    clearCart()
  }

  return (
    <div className="w-full bg-[#f8f8f8] min-h-screen py-10 font-sans text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Left Column: Logistics & Payment Selection */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* Header Title */}
          <div className="border-b border-gray-900/80 pb-3 flex items-baseline justify-between">
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
              CHECKOUT
            </h1>
            <span className="text-xs font-bold text-gray-500 tracking-wider uppercase font-mono">
              [STEP 2 OF 2]
            </span>
          </div>

          {/* Section 1: Shipping & Contact Logistics */}
          <div className="space-y-6 bg-white p-6 sm:p-8 rounded-xs border border-gray-200/80 shadow-2xs">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h2 className="text-lg font-black uppercase tracking-tight text-black flex items-center gap-2">
                <span>1. SHIPPING & CONTACT LOGISTICS</span>
              </h2>
              <span className="text-xs text-gray-400 font-mono uppercase">Verified Address</span>
            </div>

            <div className="space-y-4 text-xs">
              {/* Row 1 */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-bold text-[11px] text-gray-700 uppercase tracking-wider">
                    FULL NAME *
                  </label>
                  <input
                    type="text"
                    value={shippingDetails.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="ALEXANDER VOGUE"
                    className="w-full px-3.5 py-3 bg-[#f2f2f2] border border-gray-200 text-gray-900 placeholder:text-gray-400 uppercase tracking-wider focus:outline-none focus:border-black focus:bg-white transition text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-[11px] text-gray-700 uppercase tracking-wider">
                    PHONE CONTACT *
                  </label>
                  <input
                    type="text"
                    value={shippingDetails.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3.5 py-3 bg-[#f2f2f2] border border-gray-200 text-gray-900 placeholder:text-gray-400 uppercase tracking-wider focus:outline-none focus:border-black focus:bg-white transition text-xs font-medium"
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="space-y-1.5">
                <label className="block font-bold text-[11px] text-gray-700 uppercase tracking-wider">
                  DELIVERY ADDRESS *
                </label>
                <input
                  type="text"
                  value={shippingDetails.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="STREET, BUILDING, APARTMENT NO."
                  className="w-full px-3.5 py-3 bg-[#f2f2f2] border border-gray-200 text-gray-900 placeholder:text-gray-400 uppercase tracking-wider focus:outline-none focus:border-black focus:bg-white transition text-xs font-medium"
                />
              </div>

              {/* Row 3 */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-bold text-[11px] text-gray-700 uppercase tracking-wider">
                    CITY *
                  </label>
                  <input
                    type="text"
                    value={shippingDetails.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="NEW YORK"
                    className="w-full px-3.5 py-3 bg-[#f2f2f2] border border-gray-200 text-gray-900 placeholder:text-gray-400 uppercase tracking-wider focus:outline-none focus:border-black focus:bg-white transition text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-[11px] text-gray-700 uppercase tracking-wider">
                    POSTAL CODE *
                  </label>
                  <input
                    type="text"
                    value={shippingDetails.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    placeholder="10001"
                    className="w-full px-3.5 py-3 bg-[#f2f2f2] border border-gray-200 text-gray-900 placeholder:text-gray-400 uppercase tracking-wider focus:outline-none focus:border-black focus:bg-white transition text-xs font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Payment Method Selection */}
          <div className="space-y-6 bg-white p-6 sm:p-8 rounded-xs border border-gray-200/80 shadow-2xs">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h2 className="text-lg font-black uppercase tracking-tight text-black">
                2. SELECT PAYMENT METHOD
              </h2>
              <span className="text-xs text-gray-400 font-mono flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                256-Bit SSL Encrypted
              </span>
            </div>

            {/* Payment Method Option Selector */}
            <div className="grid sm:grid-cols-3 gap-3">
              
              {/* Option 1: COD */}
              <button
                type="button"
                onClick={() => setPaymentMethod('cod')}
                className={`p-4 rounded-xs border text-left transition flex flex-col justify-between space-y-3 cursor-pointer ${
                  paymentMethod === 'cod'
                    ? 'border-black bg-black text-white'
                    : 'border-gray-200 bg-gray-50 text-gray-800 hover:border-gray-400'
                }`}
              >
                <Truck className="w-6 h-6 stroke-[1.8]" />
                <div>
                  <p className="font-bold text-xs uppercase tracking-wider">COD Payment</p>
                  <p className="text-[10px] opacity-75 mt-0.5">Pay cash upon delivery</p>
                </div>
              </button>

              {/* Option 2: VietQR */}
              <button
                type="button"
                onClick={() => setPaymentMethod('qr')}
                className={`p-4 rounded-xs border text-left transition flex flex-col justify-between space-y-3 cursor-pointer ${
                  paymentMethod === 'qr'
                    ? 'border-black bg-black text-white'
                    : 'border-gray-200 bg-gray-50 text-gray-800 hover:border-gray-400'
                }`}
              >
                <QrCode className="w-6 h-6 stroke-[1.8]" />
                <div>
                  <p className="font-bold text-xs uppercase tracking-wider">VietQR Transfer</p>
                  <p className="text-[10px] opacity-75 mt-0.5">Instant Mobile Banking QR</p>
                </div>
              </button>

              {/* Option 3: Credit Card */}
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-4 rounded-xs border text-left transition flex flex-col justify-between space-y-3 cursor-pointer ${
                  paymentMethod === 'card'
                    ? 'border-black bg-black text-white'
                    : 'border-gray-200 bg-gray-50 text-gray-800 hover:border-gray-400'
                }`}
              >
                <CreditCard className="w-6 h-6 stroke-[1.8]" />
                <div>
                  <p className="font-bold text-xs uppercase tracking-wider">Credit / Debit Card</p>
                  <p className="text-[10px] opacity-75 mt-0.5">Visa / Mastercard / JCB</p>
                </div>
              </button>

            </div>

            {/* Payment Method Detailed Content */}
            <div className="pt-2">
              
              {/* COD Content */}
              {paymentMethod === 'cod' && (
                <div className="p-5 bg-gray-50 rounded-xs border border-gray-200/80 space-y-2 text-xs text-gray-700">
                  <div className="flex items-center gap-2 font-bold text-black uppercase">
                    <Truck className="w-4 h-4" />
                    <span>Cash On Delivery Guidelines</span>
                  </div>
                  <p className="leading-relaxed">
                    You can inspect your garments upon white-glove courier delivery and pay cash directly to the driver. No upfront payment required.
                  </p>
                </div>
              )}

              {/* VietQR Content */}
              {paymentMethod === 'qr' && (
                <div className="p-5 bg-gray-50 rounded-xs border border-gray-200/80 space-y-6">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    
                    {/* VietQR Code Visual */}
                    <div className="w-44 h-44 bg-white p-3 border border-gray-300 rounded-lg shrink-0 flex flex-col items-center justify-center text-center shadow-xs">
                      <div className="w-full h-full bg-gray-900 text-white rounded flex flex-col items-center justify-center p-2">
                        <QrCode className="w-20 h-20 text-white mb-1" />
                        <span className="text-[9px] font-mono tracking-widest text-amber-300 uppercase">
                          VIETQR STERLING
                        </span>
                      </div>
                    </div>

                    {/* Bank Details & Copy Actions */}
                    <div className="flex-grow space-y-3 text-xs w-full">
                      <div className="p-2.5 bg-white rounded border border-gray-200 flex justify-between items-center">
                        <div>
                          <span className="text-[10px] text-gray-400 block font-semibold uppercase">BENEFICIARY BANK</span>
                          <span className="font-bold text-black">{demoBankInfo.bankName}</span>
                        </div>
                      </div>

                      <div className="p-2.5 bg-white rounded border border-gray-200 flex justify-between items-center">
                        <div>
                          <span className="text-[10px] text-gray-400 block font-semibold uppercase">ACCOUNT NUMBER</span>
                          <span className="font-bold text-black font-mono text-sm">{demoBankInfo.accountNumber}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(demoBankInfo.accountNumber, 'Account Number')}
                          className="px-3 py-1 bg-black text-white text-[10px] font-bold rounded hover:bg-gray-800 transition flex items-center gap-1 cursor-pointer"
                        >
                          {copiedField === 'Account Number' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedField === 'Account Number' ? 'COPIED' : 'COPY'}</span>
                        </button>
                      </div>

                      <div className="p-2.5 bg-white rounded border border-gray-200 flex justify-between items-center">
                        <div>
                          <span className="text-[10px] text-gray-400 block font-semibold uppercase">TRANSFER MEMO / CONTENT</span>
                          <span className="font-bold text-purple-700 font-mono">{demoBankInfo.memo}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(demoBankInfo.memo, 'Transfer Memo')}
                          className="px-3 py-1 bg-black text-white text-[10px] font-bold rounded hover:bg-gray-800 transition flex items-center gap-1 cursor-pointer"
                        >
                          {copiedField === 'Transfer Memo' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedField === 'Transfer Memo' ? 'COPIED' : 'COPY'}</span>
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* Credit Card Content */}
              {paymentMethod === 'card' && (
                <div className="p-5 bg-gray-50 rounded-xs border border-gray-200/80 space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="block font-bold text-[10px] text-gray-700 uppercase tracking-wider">
                      CARD NUMBER
                    </label>
                    <input
                      type="text"
                      value={cardDetails.number}
                      onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                      placeholder="4532 •••• •••• 8921"
                      className="w-full px-3.5 py-3 bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 font-mono uppercase tracking-wider focus:outline-none focus:border-black"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block font-bold text-[10px] text-gray-700 uppercase tracking-wider">
                        EXPIRATION DATE
                      </label>
                      <input
                        type="text"
                        value={cardDetails.expiry}
                        onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                        placeholder="MM / YY"
                        className="w-full px-3.5 py-3 bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 font-mono uppercase tracking-wider focus:outline-none focus:border-black"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block font-bold text-[10px] text-gray-700 uppercase tracking-wider">
                        SECURITY CODE (CVC)
                      </label>
                      <input
                        type="password"
                        maxLength="4"
                        value={cardDetails.cvc}
                        onChange={(e) => setCardDetails({ ...cardDetails, cvc: e.target.value })}
                        placeholder="•••"
                        className="w-full px-3.5 py-3 bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 font-mono uppercase tracking-wider focus:outline-none focus:border-black"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-bold text-[10px] text-gray-700 uppercase tracking-wider">
                      CARDHOLDER NAME
                    </label>
                    <input
                      type="text"
                      value={cardDetails.name}
                      onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                      placeholder="ALEXANDER VOGUE"
                      className="w-full px-3.5 py-3 bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 uppercase tracking-wider focus:outline-none focus:border-black"
                    />
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>

        {/* Right Column: Order Summary & Coupon Engine */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-[#f0f0f0] p-6 sm:p-8 rounded-xs border border-gray-200/80 shadow-2xs space-y-6">
            <div className="flex items-baseline justify-between border-b border-gray-300 pb-3">
              <h2 className="text-lg font-black uppercase tracking-tight text-black">
                ORDER SUMMARY
              </h2>
              <span className="text-xs font-mono font-bold text-gray-500">
                [{totalItemCount} ITEMS]
              </span>
            </div>

            {/* Items Mini List */}
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1 divide-y divide-gray-200">
              {items.map((item) => (
                <div key={item.id} className="pt-2 first:pt-0 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-12 bg-gray-200 rounded overflow-hidden shrink-0 border border-gray-300">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-bold text-black uppercase text-[11px] leading-tight truncate max-w-[130px]">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-gray-500 font-mono">
                        QTY: {item.quantity} • {item.size} / {item.color}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-black font-mono shrink-0">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-300 pt-3 space-y-3">
              
              {/* Coupon Code Input */}
              <div>
                <span className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-black" />
                  COUPON / PROMO CODE
                </span>
                
                {appliedCoupon ? (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded flex items-center justify-between text-xs text-emerald-800 font-medium">
                    <span>Code <strong>{appliedCoupon}</strong> ({discountPercent}% OFF)</span>
                    <button
                      onClick={removeCoupon}
                      className="text-emerald-700 hover:text-red-600 text-[10px] font-bold uppercase underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="e.g. AESTHETIX10"
                      className="flex-grow px-3 py-2 text-xs bg-white border border-gray-300 font-mono uppercase tracking-wider focus:outline-none focus:border-black"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition cursor-pointer shrink-0"
                    >
                      APPLY
                    </button>
                  </form>
                )}
              </div>

              {/* Financial Calculation */}
              <div className="space-y-2.5 text-xs text-gray-700 font-medium pt-2">
                <div className="flex justify-between items-center">
                  <span className="uppercase tracking-wider">SUBTOTAL</span>
                  <span className="font-bold text-black font-mono">${subtotal.toFixed(2)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-emerald-700 font-bold">
                    <span className="uppercase tracking-wider">PROMO DISCOUNT ({discountPercent}%)</span>
                    <span className="font-mono">-${discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="uppercase tracking-wider">PRIORITY SHIPPING</span>
                  <span className="font-bold text-black font-mono">
                    ${subtotal > 0 ? shippingCost.toFixed(2) : '0.00'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="uppercase tracking-wider">AI FIT INSURANCE</span>
                  <span className="font-bold text-[#d97706] font-mono">
                    ${aiInsuranceCost.toFixed(2)}
                  </span>
                </div>

                <div className="border-t border-gray-300 my-3" />

                <div className="flex justify-between items-baseline pt-1">
                  <span className="font-black text-xl text-black uppercase tracking-tight">
                    TOTAL
                  </span>
                  <span className="font-black text-2xl text-black font-mono">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>

            </div>

            {/* Place Order & Pay Button */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handlePlaceOrder}
                className="w-full py-4 bg-black text-white font-black text-xs uppercase tracking-widest hover:bg-gray-800 transition cursor-pointer shadow-md active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <span>PLACE ORDER & PAY NOW</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[9px] text-center text-gray-500 font-semibold tracking-wider uppercase font-mono">
                AES-256 SSL ENCRYPTED CHECKOUT VIA AESTHETIX CORE
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* Checkout Success Modal */}
      <CheckoutSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={handleModalClose}
        orderData={completedOrderData}
      />
    </div>
  )
}
