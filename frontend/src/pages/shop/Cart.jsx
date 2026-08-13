import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, ArrowRight, Minus, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import useCartStore from '../../store/cartStore'
import { formatCurrency } from '../../utils/formatCurrency.js'
import { AIStylistChatModal } from '../../components/CartModals'

export default function Cart() {
  const navigate = useNavigate()
  const {
    items,
    updateQuantity,
    removeItem,
    getSubtotal,
    getTotal,
    shippingCost,
    aiInsuranceCost,
    shippingDetails,
    setShippingDetails,
  } = useCartStore()

  const [isStylistModalOpen, setIsStylistModalOpen] = useState(false)

  const subtotal = getSubtotal()
  const total = getTotal()
  const totalItemCount = items.reduce((acc, item) => acc + item.quantity, 0)

  const handleInputChange = (field, value) => {
    setShippingDetails(field, value)
  }

  const handleProceedToCheckout = () => {
    if (items.length === 0) {
      toast.error('Giỏ hàng của bạn đang trống!')
      return
    }
    navigate('/checkout')
  }

  return (
    <div className="w-full bg-[#f8f8f8] min-h-screen py-10 font-sans text-gray-900">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Left Column: Your Bag List & Shipping Logistics */}
        <div className="lg:col-span-8 space-y-12">
          
          {/* Header Title */}
          <div>
            <div className="flex items-baseline justify-between border-b border-gray-900/80 pb-3">
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
                GIỎ HÀNG
              </h1>
              <span className="text-xs font-semibold text-gray-500 tracking-wider uppercase font-mono">
                [{totalItemCount} SẢN PHẨM]
              </span>
            </div>

            {/* Table Header Labels */}
            <div className="grid grid-cols-12 gap-4 pt-6 pb-2 border-b border-gray-200/80 text-[11px] font-bold text-gray-700 tracking-wider uppercase">
              <div className="col-span-3 sm:col-span-2">Sản phẩm</div>
              <div className="col-span-4 sm:col-span-5">Chi tiết</div>
              <div className="col-span-3 sm:col-span-3 text-center">Số lượng</div>
              <div className="col-span-2 sm:col-span-2 text-right">Giá</div>
            </div>

            {/* Garment Items List (Limited to 4 visible items, scrollable when > 4) */}
            {items.length === 0 ? (
              <div className="py-16 text-center space-y-4">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Giỏ hàng của bạn đang trống.
                </p>
                <Link
                  to="/collections"
                  className="inline-block px-6 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-gray-800 transition"
                >
                  Xem sản phẩm
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-200/80 max-h-[490px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                {items.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-4 py-6 items-center">
                    
                    {/* Thumbnail */}
                    <div className="col-span-3 sm:col-span-2">
                      <div className="w-16 h-20 sm:w-20 sm:h-24 bg-gray-200 overflow-hidden rounded-xs border border-gray-200/60 shadow-2xs">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover object-center hover:scale-105 transition duration-300"
                        />
                      </div>
                    </div>

                    {/* Details */}
                    <div className="col-span-4 sm:col-span-5 space-y-1">
                      <h3 className="font-extrabold text-sm sm:text-base tracking-wide text-black uppercase">
                        {item.name}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-gray-500 font-medium tracking-wider uppercase space-x-3">
                        <span>KÍCH THƯỚC: <strong className="text-gray-900">{item.size}</strong></span>
                        <span>MÀU: <strong className="text-gray-900">{item.color}</strong></span>
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="col-span-3 sm:col-span-3 flex items-center justify-center space-x-2">
                      <button
                        disabled={item.quantity <= 1}
                        onClick={() => updateQuantity(item.id, item.quantity - 1).catch((error) => toast.error(error.response?.data?.message || 'Không thể cập nhật số lượng'))}
                        className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center border border-gray-300 bg-white text-gray-700 hover:border-black hover:text-black transition cursor-pointer text-xs font-bold"
                        aria-label="Giảm số lượng"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs sm:text-sm font-bold font-mono">
                        {item.quantity}
                      </span>
                      <button
                        disabled={item.quantity >= item.stock}
                        onClick={() => updateQuantity(item.id, item.quantity + 1).catch((error) => toast.error(error.response?.data?.message || 'Không thể cập nhật số lượng'))}
                        className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center border border-gray-300 bg-white text-gray-700 hover:border-black hover:text-black transition cursor-pointer text-xs font-bold"
                        aria-label="Tăng số lượng"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeItem(item.id).catch((error) => toast.error(error.response?.data?.message || 'Không thể xóa sản phẩm'))}
                        className="ml-2 text-gray-400 hover:text-red-600 transition p-1 cursor-pointer"
                        title="Xóa sản phẩm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Price */}
                    <div className="col-span-2 sm:col-span-2 text-right font-bold text-xs sm:text-sm text-black font-mono">
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          

        </div>

        {/* Right Sidebar: Order Synthesis & Assistance */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Order Synthesis Card */}
          <div className="bg-[#f0f0f0] p-6 sm:p-8 rounded-xs border border-gray-200/80 shadow-2xs space-y-6">
            <h2 className="text-lg font-black uppercase tracking-tight text-black">
              TÓM TẮT ĐƠN HÀNG
            </h2>

            <div className="space-y-3 text-xs text-gray-700 font-medium">
              <div className="flex justify-between items-center">
                <span className="uppercase tracking-wider">TẠM TÍNH</span>
                <span className="font-bold text-black font-mono">{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="uppercase tracking-wider">PHÍ GIAO HÀNG</span>
                <span className="font-bold text-black font-mono">
                  {formatCurrency(subtotal > 0 ? shippingCost : 0)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="uppercase tracking-wider">BẢO HIỂM THỬ ĐỒ AI</span>
                <span className="font-bold text-[#d97706] font-mono">
                  {formatCurrency(aiInsuranceCost)}
                </span>
              </div>

              <div className="border-t border-gray-300 my-4" />

              <div className="flex justify-between items-baseline pt-1">
                <span className="font-black text-xl text-black uppercase tracking-tight">
                  TỔNG CỘNG
                </span>
                <span className="font-black text-2xl text-black font-mono">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            {/* AI Smart Recommendation Box */}
            <div className="bg-white p-4 rounded-xs border border-gray-200/60 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-[#d97706]">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span className="font-bold text-[10px] uppercase tracking-wider">
                  GỢI Ý THÔNG MINH TỪ AI
                </span>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed font-medium">
                Dựa trên kết quả thử đồ trực tuyến, AI gợi ý áo blazer cỡ L để có phom rộng vừa vặn nhất.
              </p>
            </div>

            {/* Proceed to Checkout Button */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleProceedToCheckout}
                className="w-full py-4 bg-black text-white font-black text-xs uppercase tracking-widest hover:bg-gray-800 transition cursor-pointer shadow-md active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <span>TIẾN HÀNH THANH TOÁN</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[9px] text-center text-gray-500 font-semibold tracking-wider uppercase font-mono">
                THANH TOÁN BẢO MẬT QUA HỆ THỐNG AESTHETIX
              </p>
            </div>
          </div>

          {/* Need Assistance Card */}
          <div
            onClick={() => setIsStylistModalOpen(true)}
            className="bg-white p-5 rounded-xs border border-gray-200/80 hover:border-black transition cursor-pointer shadow-2xs flex items-center justify-between group"
          >
            <div>
              <h3 className="font-extrabold text-xs text-black uppercase tracking-wider">
                BẠN CẦN HỖ TRỢ?
              </h3>
              <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                Trợ lý thời trang AI luôn trực tuyến 24/7
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-800 group-hover:translate-x-1 transition" />
          </div>

        </div>

      </div>

      {/* Modals */}
      <AIStylistChatModal
        isOpen={isStylistModalOpen}
        onClose={() => setIsStylistModalOpen(false)}
      />
    </div>
  )
}
