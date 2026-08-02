import { useState } from 'react'
import { X, CheckCircle2, Sparkles, Send, Bot, ShieldCheck } from 'lucide-react'

export function OrderSuccessModal({ isOpen, onClose, orderData }) {
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

        <div className="text-center space-y-4 mb-6">
          <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-8 h-8 stroke-[1.8]" />
          </div>
          <div>
            <h3 className="font-black text-2xl uppercase tracking-wider text-gray-900">
              COD Order Confirmed
            </h3>
            <p className="text-xs text-gray-500 font-mono mt-1">
              ORDER #{orderData?.orderId || 'AEST-89421-COD'}
            </p>
          </div>
        </div>

        <div className="space-y-3 bg-gray-50 p-5 rounded-2xl border border-gray-100 text-xs text-gray-700">
          <div className="flex justify-between font-semibold text-sm border-b border-gray-200 pb-2">
            <span>Payment Method</span>
            <span className="text-black uppercase">Cash On Delivery (COD)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Recipient Name</span>
            <span className="font-medium">{orderData?.fullName || 'Alexander Vogue'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Delivery Address</span>
            <span className="font-medium text-right max-w-[200px] truncate">
              {orderData?.address || '123 Fashion Ave'}, {orderData?.city || 'New York'}
            </span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-200 font-bold text-sm text-black">
            <span>Total Payable Amount</span>
            <span>${orderData?.total?.toFixed(2) || '860.00'}</span>
          </div>
        </div>

        <div className="mt-4 p-3 bg-purple-50 rounded-xl flex items-center gap-2 text-xs text-purple-800">
          <Sparkles className="w-4 h-4 shrink-0 text-purple-600" />
          <span>Estimated arrival in 2-3 business days via Priority Express.</span>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-3.5 bg-black text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-gray-800 transition cursor-pointer"
        >
          Return to Shopping
        </button>
      </div>
    </div>
  )
}

export function AIStylistChatModal({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello Alexander! I am your 24/7 AESTHETIX AI Stylist. Based on your cart items, the Cyber-Tailored Blazer pair exceptionally well with raw denim or tailored wool trousers. How can I assist your silhouette choice today?',
    },
  ])
  const [input, setInput] = useState('')

  if (!isOpen) return null

  const handleSend = (e) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMsg = { sender: 'user', text: input.trim() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'Great choice! Size L for the Cyber-Tailored Blazer gives a slightly dropped shoulder fit that balances perfectly with the CHALK Hoodie underneath.',
        },
      ])
    }, 1000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl max-w-md w-full h-[520px] flex flex-col shadow-2xl relative border border-gray-100 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-4 bg-gray-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Bot className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider">AESTHETIX AI Stylist</h4>
              <p className="text-[10px] text-gray-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block"></span>
                Online 24/7 • Fitting Assistant
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-grow p-4 overflow-y-auto space-y-3 bg-gray-50/50">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[82%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-black text-white rounded-br-none'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-xs'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-200 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about fit, sizing, or styling..."
            className="flex-grow px-3.5 py-2 text-xs bg-gray-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-black"
          />
          <button
            type="submit"
            className="p-2.5 bg-black text-white rounded-xl hover:bg-gray-800 transition cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
