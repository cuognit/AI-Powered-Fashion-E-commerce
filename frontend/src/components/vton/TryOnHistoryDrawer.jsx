import { useState, useEffect } from 'react'
import { History, Trash2, ExternalLink, Sparkles, Clock, AlertCircle } from 'lucide-react'
import { getTryOnHistory, deleteTryOnHistory } from '../../services/vtonApi.js'
import toast from 'react-hot-toast'

export default function TryOnHistoryDrawer({
  isAuthenticated,
  onSelectHistoryItem,
  refreshTrigger,
}) {
  const [historyItems, setHistoryItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchHistory = async (targetPage = 1) => {
    if (!isAuthenticated) return
    try {
      setLoading(true)
      const { data } = await getTryOnHistory({ page: targetPage, limit: 8 })
      if (data?.data?.items) {
        setHistoryItems(data.data.items)
        setTotalPages(data.data.pagination?.totalPages || 1)
        setPage(targetPage)
      }
    } catch (err) {
      console.warn('Không thể tải lịch sử thử đồ:', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory(1)
  }, [isAuthenticated, refreshTrigger])

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    try {
      await deleteTryOnHistory(id)
      setHistoryItems((prev) => prev.filter((item) => item._id !== id))
      toast.success('Đã xóa bản ghi lịch sử')
    } catch (err) {
      toast.error('Không thể xóa bản ghi')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm text-center">
        <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <History size={24} />
        </div>
        <h4 className="text-sm font-bold text-gray-900">Lịch sử Thử Đồ</h4>
        <p className="text-xs text-gray-500 mt-1 mb-4 leading-relaxed">
          Đăng nhập vào tài khoản của bạn để tự động lưu lại và xem lại tất cả các bức ảnh đã thử đồ bằng AI.
        </p>
        <a
          href="/login"
          className="inline-block px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-gray-800 transition"
        >
          Đăng nhập ngay
        </a>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
            <History size={16} />
          </span>
          <h3 className="text-sm font-black uppercase tracking-tight text-gray-900">
            Lịch sử Thử Đồ ({historyItems.length})
          </h3>
        </div>

        <button
          type="button"
          onClick={() => fetchHistory(1)}
          className="text-[11px] font-semibold text-purple-600 hover:text-purple-800 cursor-pointer"
        >
          Làm mới
        </button>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto py-4 custom-scrollbar space-y-3 max-h-[520px]">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-2xl animate-pulse">
                <div className="w-16 h-20 bg-gray-200 rounded-xl" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 bg-gray-200 rounded-md w-3/4" />
                  <div className="h-3 bg-gray-200 rounded-md w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : historyItems.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <Sparkles className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-xs font-semibold text-gray-600">Chưa có lịch sử thử đồ nào</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Kết quả thử đồ của bạn sẽ xuất hiện tại đây.</p>
          </div>
        ) : (
          historyItems.map((item) => {
            const hasResult = item.status === 'completed' && item.result_image
            const displayImage = hasResult ? item.result_image : item.garment_image
            const timeAgo = new Date(item.createdAt).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })

            return (
              <div
                key={item._id}
                onClick={() => hasResult && onSelectHistoryItem(item)}
                className={`group relative flex gap-3 p-2.5 rounded-2xl border transition-all ${
                  hasResult
                    ? 'border-gray-100 hover:border-purple-300 hover:bg-purple-50/20 cursor-pointer'
                    : 'border-red-100 bg-red-50/10'
                }`}
              >
                {/* Thumbnail */}
                <div className="w-16 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0 relative">
                  <img
                    src={displayImage}
                    alt={item.description || 'Try-On'}
                    className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  {hasResult && (
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/75 text-white text-[8px] font-bold rounded-md uppercase">
                      AI
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div>
                    <p className="text-xs font-bold text-gray-900 truncate" title={item.description}>
                      {item.product?.name || item.description || 'Trang phục thử đồ'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {item.status === 'completed' && (
                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold rounded-md">
                          Hoàn tất
                        </span>
                      )}
                      {item.status === 'processing' && (
                        <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-bold rounded-md animate-pulse">
                          Đang xử lý
                        </span>
                      )}
                      {item.status === 'failed' && (
                        <span className="px-1.5 py-0.5 bg-red-50 text-red-700 text-[9px] font-bold rounded-md flex items-center gap-0.5">
                          <AlertCircle size={9} />
                          Lỗi
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {timeAgo}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, item._id)}
                      className="p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 transition opacity-0 group-hover:opacity-100"
                      title="Xóa bản ghi"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => fetchHistory(page - 1)}
            className="px-2.5 py-1 rounded-lg border border-gray-200 disabled:opacity-40"
          >
            Trước
          </button>
          <span>
            Trang {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => fetchHistory(page + 1)}
            className="px-2.5 py-1 rounded-lg border border-gray-200 disabled:opacity-40"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  )
}
