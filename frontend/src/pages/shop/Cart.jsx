import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, ArrowRight, Minus, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import useCartStore from '../../store/cartStore'
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
      toast.error('Your bag is currently empty!')
      return
    }
    navigate('/checkout')
  }

  return (
    <div className="w-full bg-[#f8f8f8] min-h-screen py-10 font-sans text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Left Column: Your Bag List & Shipping Logistics */}
        <div className="lg:col-span-8 space-y-12">
          
          {/* Header Title */}
          <div>
            <div className="flex items-baseline justify-between border-b border-gray-900/80 pb-3">
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
                YOUR BAG
              </h1>
              <span className="text-xs font-semibold text-gray-500 tracking-wider uppercase font-mono">
                [{totalItemCount} {totalItemCount === 1 ? 'ITEM' : 'ITEMS'}]
              </span>
            </div>

            {/* Table Header Labels */}
            <div className="grid grid-cols-12 gap-4 pt-6 pb-2 border-b border-gray-200/80 text-[11px] font-bold text-gray-700 tracking-wider uppercase">
              <div className="col-span-3 sm:col-span-2">Garment</div>
              <div className="col-span-4 sm:col-span-5">Details</div>
              <div className="col-span-3 sm:col-span-3 text-center">Quantity</div>
              <div className="col-span-2 sm:col-span-2 text-right">Price</div>
            </div>

            {/* Garment Items List (Limited to 4 visible items, scrollable when > 4) */}
            {items.length === 0 ? (
              <div className="py-16 text-center space-y-4">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Your bag is empty.
                </p>
                <Link
                  to="/collections"
                  className="inline-block px-6 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-gray-800 transition"
                >
                  Browse Catalog
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
                        <span>SIZE: <strong className="text-gray-900">{item.size}</strong></span>
                        <span>COLOR: <strong className="text-gray-900">{item.color}</strong></span>
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="col-span-3 sm:col-span-3 flex items-center justify-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center border border-gray-300 bg-white text-gray-700 hover:border-black hover:text-black transition cursor-pointer text-xs font-bold"
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs sm:text-sm font-bold font-mono">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center border border-gray-300 bg-white text-gray-700 hover:border-black hover:text-black transition cursor-pointer text-xs font-bold"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="ml-2 text-gray-400 hover:text-red-600 transition p-1 cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Price */}
                    <div className="col-span-2 sm:col-span-2 text-right font-bold text-xs sm:text-sm text-black font-mono">
                      ${(item.price * item.quantity).toFixed(2)}
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
              ORDER SYNTHESIS
            </h2>

            <div className="space-y-3 text-xs text-gray-700 font-medium">
              <div className="flex justify-between items-center">
                <span className="uppercase tracking-wider">SUBTOTAL</span>
                <span className="font-bold text-black font-mono">${subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="uppercase tracking-wider">PRIORITY SHIPPING</span>
                <span className="font-bold text-black font-mono">
                  {subtotal > 0 ? `$${shippingCost.toFixed(2)}` : '$0.00'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="uppercase tracking-wider">AI FIT INSURANCE</span>
                <span className="font-bold text-[#d97706] font-mono">
                  ${aiInsuranceCost.toFixed(2)}
                </span>
              </div>

              <div className="border-t border-gray-300 my-4" />

              <div className="flex justify-between items-baseline pt-1">
                <span className="font-black text-xl text-black uppercase tracking-tight">
                  TOTAL
                </span>
                <span className="font-black text-2xl text-black font-mono">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* AI Smart Recommendation Box */}
            <div className="bg-white p-4 rounded-xs border border-gray-200/60 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-[#d97706]">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span className="font-bold text-[10px] uppercase tracking-wider">
                  AI SMART RECOMMENDATION
                </span>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed font-medium">
                Based on your virtual try-on, we've adjusted the Blazer size to 'L' for the perfect oversized silhouette.
              </p>
            </div>

            {/* Proceed to Checkout Button */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleProceedToCheckout}
                className="w-full py-4 bg-black text-white font-black text-xs uppercase tracking-widest hover:bg-gray-800 transition cursor-pointer shadow-md active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <span>PROCEED TO CHECKOUT</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[9px] text-center text-gray-500 font-semibold tracking-wider uppercase font-mono">
                SECURE PAYMENT PROCESSED VIA AESTHETIX CORE
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
                NEED ASSISTANCE?
              </h3>
              <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                Our AI Stylists are online 24/7
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
