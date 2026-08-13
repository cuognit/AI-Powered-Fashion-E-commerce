import { Sparkles, Upload, Eye } from 'lucide-react'

export default function AITryOn() {
  return (
    <div className="max-w-[1360px] mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>Phòng thử đồ sáng tạo</span>
        </div>
        <h1 className="text-3xl font-black uppercase tracking-wider text-gray-900 mb-2">Thử đồ trực tuyến bằng AI</h1>
        <p className="text-sm text-gray-500">Hình dung độ vừa vặn của trang phục trên vóc dáng với độ chính xác cao.</p>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-8">
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center hover:border-black transition cursor-pointer bg-gray-50/50">
          <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="font-semibold text-sm text-gray-900">Tải ảnh toàn thân hoặc chọn người mẫu</p>
          <p className="text-xs text-gray-400 mt-1">PNG, JPG tối đa 10 MB. Ảnh sẽ tự động được xóa.</p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Eye className="w-4 h-4 text-black" />
            <span>Quy trình AI mã hóa đang hoạt động</span>
          </div>
          <button className="px-6 py-3 bg-black text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-gray-800 transition cursor-pointer">
            Tạo bản xem trước
          </button>
        </div>
      </div>
    </div>
  )
}
