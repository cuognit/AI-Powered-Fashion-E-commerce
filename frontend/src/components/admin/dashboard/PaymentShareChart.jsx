import { CreditCard, DollarSign } from 'lucide-react'

const formatCurrency = (val) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(val || 0)

export default function PaymentShareChart({ data = [], loading }) {
  const totalAmount = data.reduce((sum, item) => sum + (item.totalAmount || 0), 0)
  const totalCount = data.reduce((sum, item) => sum + (item.count || 0), 0)

  const vnpayData = data.find((d) => d.method === 'VNPAY') || { count: 0, totalAmount: 0 }
  const codData = data.find((d) => d.method === 'COD') || { count: 0, totalAmount: 0 }

  const vnpayPercent = totalCount > 0 ? Math.round((vnpayData.count / totalCount) * 100) : 0
  const codPercent = totalCount > 0 ? Math.round((codData.count / totalCount) * 100) : 0

  return (
    <div className='border border-neutral-200 bg-white p-6'>
      <div className='border-b border-neutral-200 pb-4'>
        <span className='text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500'>Dòng tiền</span>
        <h3 className='text-lg font-black uppercase tracking-tight text-neutral-950'>
          Phương Thức Thanh Toán
        </h3>
      </div>

      {loading ? (
        <div className='mt-6 h-48 animate-pulse bg-neutral-100' />
      ) : (
        <div className='mt-6 space-y-5'>
          {/* Progress Bar comparison */}
          <div>
            <div className='flex justify-between text-xs font-bold uppercase mb-2'>
              <span className='text-indigo-600 flex items-center gap-1.5'>
                <CreditCard className='h-3.5 w-3.5' /> VNPAY Trực Tuyến ({vnpayPercent}%)
              </span>
              <span className='text-neutral-700 flex items-center gap-1.5'>
                COD Tiền Mặt ({codPercent}%) <DollarSign className='h-3.5 w-3.5' />
              </span>
            </div>
            <div className='h-3 w-full overflow-hidden rounded-full bg-neutral-200 flex'>
              <div
                className='h-full bg-indigo-600 transition-all duration-500'
                style={{ width: `${vnpayPercent}%` }}
              />
              <div
                className='h-full bg-neutral-900 transition-all duration-500'
                style={{ width: `${codPercent}%` }}
              />
            </div>
          </div>

          {/* Cards Breakdown */}
          <div className='grid grid-cols-2 gap-3 pt-2'>
            <div className='border border-neutral-200 bg-[#fbfbfb] p-3.5'>
              <div className='flex items-center gap-2'>
                <span className='h-2 w-2 rounded-full bg-indigo-600' />
                <span className='text-[10px] font-bold uppercase tracking-wider text-neutral-500'>VNPAY Gateway</span>
              </div>
              <p className='mt-1.5 text-lg font-black'>{formatCurrency(vnpayData.totalAmount)}</p>
              <p className='text-xs text-neutral-600'>{vnpayData.count} đơn hàng</p>
            </div>

            <div className='border border-neutral-200 bg-[#fbfbfb] p-3.5'>
              <div className='flex items-center gap-2'>
                <span className='h-2 w-2 rounded-full bg-neutral-900' />
                <span className='text-[10px] font-bold uppercase tracking-wider text-neutral-500'>COD Khi Nhận Hàng</span>
              </div>
              <p className='mt-1.5 text-lg font-black'>{formatCurrency(codData.totalAmount)}</p>
              <p className='text-xs text-neutral-600'>{codData.count} đơn hàng</p>
            </div>
          </div>

          <div className='flex items-center justify-between border-t border-neutral-100 pt-3 text-xs'>
            <span className='text-neutral-500'>Tổng giá trị luân chuyển:</span>
            <span className='font-bold text-neutral-950'>{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
