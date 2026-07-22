import { Link } from 'react-router-dom'
import { X, CheckCircle2, ShieldCheck, Sparkles, ArrowRight, Package } from 'lucide-react'

export function CheckoutSuccessModal({ isOpen, onClose, orderData }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl relative border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-black p-1 rounded-full hover:bg-gray-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-3 mb-6">
          <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-8 h-8 stroke-[1.8]" />
          </div>
          <div>
            <span className="inline-block px-3 py-1 bg-purple-50 text-purple-700 text-[10px] font-bold rounded-full uppercase tracking-wider mb-1">
              Payment Confirmed
            </span>
            <h3 className="font-black text-2xl uppercase tracking-wider text-gray-900">
              Order Completed
            </h3>
            <p className="text-xs text-gray-500 font-mono mt-0.5">
              RECEIPT #{orderData?.orderId || 'AEST-99420-PAY'}
            </p>
          </div>
        </div>

        <div className="space-y-3 bg-gray-50 p-5 rounded-2xl border border-gray-100 text-xs text-gray-700">
          <div className="flex justify-between font-semibold text-sm border-b border-gray-200 pb-2">
            <span>Payment Method</span>
            <span className="text-black uppercase font-bold">
              {orderData?.paymentMethodName || 'VietQR Banking'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Customer</span>
            <span className="font-medium">{orderData?.fullName || 'Alexander Vogue'}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Phone</span>
            <span className="font-medium font-mono">{orderData?.phone || '+1 (555) 000-0000'}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Delivery Address</span>
            <span className="font-medium text-right max-w-[200px] truncate">
              {orderData?.address || '123 Fashion Ave'}, {orderData?.city || 'New York'}
            </span>
          </div>

          {orderData?.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-700 font-medium">
              <span>Coupon Discount ({orderData?.appliedCoupon})</span>
              <span>-${orderData?.discountAmount?.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between pt-2 border-t border-gray-200 font-bold text-sm text-black">
            <span>Total Paid</span>
            <span className="font-mono text-base">${orderData?.total?.toFixed(2) || '860.00'}</span>
          </div>
        </div>

        <div className="mt-4 p-3 bg-[#f8f8f8] rounded-xl flex items-center gap-2.5 text-xs text-gray-700 border border-gray-200/60">
          <Package className="w-4 h-4 text-black shrink-0" />
          <span>Priority White-Glove Shipping dispatched within 24 hours.</span>
        </div>

        <div className="mt-6 flex gap-3">
          <Link
            to="/collections"
            onClick={onClose}
            className="flex-1 py-3.5 bg-black text-white text-center font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-gray-800 transition cursor-pointer"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
