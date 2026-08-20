import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  Bot,
  ChevronDown,
  History,
  MessageSquare,
  Package,
  Plus,
  RotateCcw,
  Send,
  ShoppingBag,
  Sparkles,
  Square,
  Trash2,
  User,
  X,
} from 'lucide-react'
import { useChatStream } from '../hooks/useChatStream.js'
import { useAuthContext } from '../contexts/AuthContext.jsx'

const QUICK_PROMPTS = [
  '🔥 Top sản phẩm bán chạy nhất tuần này',
  'Tìm áo sơ mi lụa công sở thanh lịch dưới 700k',
  'Áo chống nắng nữ UPF 50+ thoáng mát đi biển',
  'Bộ đồ tập gym yoga nữ co giãn tốt',
  'Kiểm tra tình trạng đơn hàng gần nhất của tôi',
]

export default function ChatWidget() {
  const { isAuthenticated } = useAuthContext()
  const {
    isOpen,
    openChat,
    toggleChat,
    closeChat,
    messages,
    conversations,
    currentConversationId,
    isStreaming,
    isLoadingHistory,
    error,
    sendMessage,
    abortStream,
    retryLastMessage,
    startNewConversation,
    selectConversation,
    removeConversation,
  } = useChatStream()

  const [inputMessage, setInputMessage] = useState('')
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Lắng nghe sự kiện mở ô chat từ các trang khác (ví dụ: Giỏ hàng, Chi tiết sản phẩm)
  useEffect(() => {
    const handleOpen = (e) => {
      openChat()
      if (e.detail?.prompt) {
        setInputMessage(e.detail.prompt)
      }
      setTimeout(() => inputRef.current?.focus(), 150)
    }
    window.addEventListener('open-fashion-chat', handleOpen)
    return () => window.removeEventListener('open-fashion-chat', handleOpen)
  }, [openChat])

  // Tự động cuộn xuống cuối khi có tin nhắn mới hoặc token stream
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isStreaming])

  // Focus ô nhập khi mở widget
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen])

  const handleSend = (e) => {
    e?.preventDefault()
    if (!inputMessage.trim() || isStreaming) return
    sendMessage(inputMessage)
    setInputMessage('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleQuickPrompt = (promptText) => {
    sendMessage(promptText)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          aria-label="Mở trợ lý ảo AI"
          className="group relative flex h-14 items-center gap-2.5 rounded-full bg-gradient-to-r from-neutral-900 via-neutral-800 to-black px-5 py-3 text-white shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-black/30 active:scale-95"
        >
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
          </span>
          <Sparkles className="h-5 w-5 text-amber-300 transition-transform group-hover:rotate-12" />
          <span className="text-sm font-semibold tracking-wide">Trợ lý AI</span>
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="flex h-[600px] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl ring-1 ring-black/5 transition-all duration-300 sm:w-[420px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-100 bg-gradient-to-r from-neutral-900 via-neutral-800 to-black px-4 py-3.5 text-white">
            <div className="flex items-center gap-3">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 to-amber-200 text-neutral-900 shadow-md">
                <Bot className="h-5 w-5" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-neutral-900 bg-emerald-500" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold tracking-wide">Fashion AI Assistant</h3>
                  <span className="rounded-full bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
                    RAG
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400">Tư vấn phong cách & Tra cứu đơn</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Lịch sử hội thoại (Chỉ cho user đăng nhập) */}
              {isAuthenticated && (
                <div className="relative">
                  <button
                    onClick={() => setShowHistoryDropdown((prev) => !prev)}
                    title="Lịch sử cuộc trò chuyện"
                    className="rounded-lg p-1.5 text-neutral-300 transition hover:bg-neutral-800 hover:text-white"
                  >
                    <History className="h-4 w-4" />
                  </button>

                  {/* Dropdown danh sách cuộc trò chuyện */}
                  {showHistoryDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1.5 shadow-xl ring-1 ring-black/5 z-50 text-neutral-900">
                      <div className="flex items-center justify-between border-b border-neutral-100 px-3 py-2">
                        <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider">
                          Các đoạn chat
                        </span>
                        <button
                          onClick={() => {
                            startNewConversation()
                            setShowHistoryDropdown(false)
                          }}
                          className="flex items-center gap-1 text-xs font-semibold text-neutral-900 hover:underline"
                        >
                          <Plus className="h-3.5 w-3.5" /> Mới
                        </button>
                      </div>

                      <div className="max-h-60 overflow-y-auto">
                        {conversations.length === 0 ? (
                          <div className="p-4 text-center text-xs text-neutral-400">
                            Chưa có lịch sử cuộc trò chuyện nào.
                          </div>
                        ) : (
                          conversations.map((conv) => (
                            <div
                              key={conv._id}
                              className={`group flex items-center justify-between px-3 py-2 text-xs transition hover:bg-neutral-50 ${
                                conv._id === currentConversationId ? 'bg-neutral-100 font-bold' : ''
                              }`}
                            >
                              <button
                                onClick={() => {
                                  selectConversation(conv._id)
                                  setShowHistoryDropdown(false)
                                }}
                                className="flex-1 truncate text-left"
                              >
                                {conv.title || 'Cuộc trò chuyện'}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeConversation(conv._id)
                                }}
                                title="Xóa đoạn chat"
                                className="opacity-0 transition group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Nút Tạo đoạn chat mới */}
              <button
                onClick={startNewConversation}
                title="Tạo cuộc hội thoại mới"
                className="rounded-lg p-1.5 text-neutral-300 transition hover:bg-neutral-800 hover:text-white"
              >
                <Plus className="h-4 w-4" />
              </button>

              {/* Nút Đóng */}
              <button
                onClick={closeChat}
                title="Thu nhỏ cửa sổ"
                className="rounded-lg p-1.5 text-neutral-300 transition hover:bg-neutral-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 space-y-4 overflow-y-auto bg-neutral-50 p-4">
            {isLoadingHistory ? (
              <div className="flex h-full items-center justify-center">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col justify-center space-y-5 py-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-800 shadow-inner">
                  <Sparkles className="h-7 w-7 text-amber-500" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-neutral-900">Chào bạn! Tôi có thể giúp gì?</h4>
                  <p className="text-xs text-neutral-500">
                    Hãy hỏi tôi về cách chọn size, phối đồ, tìm sản phẩm hoặc tra cứu đơn hàng.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
                    Gợi ý nhanh cho bạn
                  </p>
                  <div className="flex flex-col gap-2">
                    {QUICK_PROMPTS.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickPrompt(prompt)}
                        className="rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-left text-xs font-medium text-neutral-700 shadow-sm transition hover:border-neutral-400 hover:bg-neutral-100"
                      >
                        💡 {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isUser = msg.role === 'user'
                return (
                  <div
                    key={msg.id || index}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-start gap-2 max-w-[88%]">
                      {!isUser && (
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white shadow-sm">
                          <Bot className="h-4 w-4 text-amber-300" />
                        </div>
                      )}

                      <div
                        className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm ${
                          isUser
                            ? 'rounded-tr-sm bg-neutral-900 text-white'
                            : 'rounded-tl-sm border border-neutral-200 bg-white text-neutral-800'
                        }`}
                      >
                        {msg.content ? (
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        ) : msg.isStreaming ? (
                          <div className="flex items-center gap-1.5 py-1 text-neutral-400">
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400" />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:0.2s]" />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:0.4s]" />
                            <span className="ml-1 text-[11px]">Đang tìm kiếm thông tin...</span>
                          </div>
                        ) : null}
                      </div>

                      {isUser && (
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-neutral-700">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>

                    {/* Product Source Cards: Chỉ hiển thị khi trợ lý đã bắt đầu phản hồi hoặc đã trả lời xong */}
                    {!isUser && msg.content && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2.5 ml-9 w-full max-w-[88%] space-y-1.5">
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-neutral-500">
                          <ShoppingBag className="h-3.5 w-3.5 text-neutral-700" />
                          <span>Sản phẩm & Đơn hàng tham khảo ({msg.sources.length}):</span>
                        </div>

                        <div className="flex gap-2 overflow-x-auto pb-1.5 pt-0.5">
                          {msg.sources.map((src, sIdx) => {
                            if (src.type === 'order') {
                              return (
                                <Link
                                  key={sIdx}
                                  to="/account/orders"
                                  className="flex shrink-0 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 p-2 text-emerald-900 shadow-sm transition hover:bg-emerald-100"
                                >
                                  <Package className="h-4 w-4 text-emerald-600" />
                                  <div className="text-left">
                                    <div className="font-bold text-[11px]">{src.label}</div>
                                    <div className="text-[10px] text-emerald-700">Xem chi tiết</div>
                                  </div>
                                </Link>
                              )
                            }

                            return (
                              <Link
                                key={sIdx}
                                to={src.url || `/products/${src.id}`}
                                className="group relative flex w-40 shrink-0 flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                              >
                                {/* Best Seller Badge */}
                                {(src.isBestSeller || src.unitsSold > 0) && (
                                  <div className="absolute top-1.5 left-1.5 z-10 flex items-center gap-1 rounded-md bg-amber-500/95 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs backdrop-blur-xs">
                                    <span>🔥 Bán chạy</span>
                                    {src.unitsSold > 0 && <span className="opacity-90 font-medium">({src.unitsSold})</span>}
                                  </div>
                                )}

                                {src.image ? (
                                  <img
                                    src={src.image}
                                    alt={src.label}
                                    className="h-20 w-full object-cover transition duration-300 group-hover:scale-105"
                                  />
                                ) : (
                                  <div className="flex h-20 w-full items-center justify-center bg-neutral-100 text-neutral-400">
                                    <ShoppingBag className="h-6 w-6" />
                                  </div>
                                )}
                                <div className="p-2 space-y-1">
                                  <div className="line-clamp-2 text-[11px] font-semibold text-neutral-900 group-hover:text-neutral-600">
                                    {src.label}
                                  </div>
                                  <div className="flex items-center justify-between gap-1">
                                    {src.price != null && (
                                      <div className="text-[11px] font-bold text-red-600">
                                        {src.price.toLocaleString('vi-VN')}₫
                                      </div>
                                    )}
                                    {src.rating > 0 && (
                                      <div className="flex items-center gap-0.5 text-[10px] font-semibold text-amber-600">
                                        <span>★</span>
                                        <span>{src.rating}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Error indicator */}
                    {msg.status === 'error' && (
                      <div className="mt-2 ml-9 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-700 border border-red-200">
                        <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                        <span>{msg.error || 'Có lỗi xảy ra trong quá trình phản hồi.'}</span>
                        <button
                          onClick={retryLastMessage}
                          className="ml-auto flex items-center gap-1 font-semibold underline hover:text-red-900"
                        >
                          <RotateCcw className="h-3 w-3" /> Thử lại
                        </button>
                      </div>
                    )}
                  </div>
                )
              })
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Form */}
          <div className="border-t border-neutral-200 bg-white p-3">
            <form onSubmit={handleSend} className="space-y-2">
              <div className="relative flex items-center">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Nhập câu hỏi cho trợ lý thời trang..."
                  rows={1}
                  maxLength={2000}
                  disabled={isStreaming}
                  className="w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 pr-20 text-xs text-neutral-900 transition focus:border-neutral-900 focus:bg-white focus:outline-none disabled:opacity-60"
                />

                <div className="absolute right-2 flex items-center gap-1.5">
                  {isStreaming ? (
                    <button
                      type="button"
                      onClick={abortStream}
                      title="Dừng phản hồi"
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-200 text-neutral-800 transition hover:bg-neutral-300"
                    >
                      <Square className="h-3.5 w-3.5 fill-current" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!inputMessage.trim()}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 text-white transition hover:bg-black disabled:opacity-30"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-neutral-400">
                <span>Shift + Enter để xuống dòng</span>
                <span>{inputMessage.length}/2000</span>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
