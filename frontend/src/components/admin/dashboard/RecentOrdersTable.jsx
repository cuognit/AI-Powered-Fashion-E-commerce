import { ArrowRight, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'

const formatCurrency = (val) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0)

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} ${d.getDate()}/${d.getMonth() + 1}`
}

const statusBadge = {
  pending: { label: 'Chờ xử lý', class: 'bg-amber-100 text-amber-900 border-amber-300' },
  processing: { label: 'Đang xử lý', class: 'bg-blue-100 text-blue-900 border-blue-300' },
  ready_to_ship: { label: 'Sẵn sàng', class: 'bg-purple-100 text-purple-900 border-purple-300' },
  shipped: { label: 'Đang giao', class: 'bg-cyan-100 text-cyan-900 border-cyan-300' },
  completed: { label: 'Hoàn tất', class: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  canceled: { label: 'Đã hủy', class: 'bg-rose-100 text-rose-900 border-rose-300' },
}

export default function RecentOrdersTable({ orders = [], loading, onSelectOrder }) {
  return (
    <div className='border border-neutral-200 bg-white p-6'>
      <div className='flex items-center justify-between border-b border-neutral-200 pb-4'>
        <div>
          <span className='text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500'>Đơn hàng mới</span>
          <h3 className='text-lg font-black uppercase tracking-tight text-neutral-950'>
            Đơn Hàng Gần Đây Cần Xử Lý
          </h3>
        </div>
        <Link
          to='/admin/orders'
          className='flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-neutral-600 hover:text-black transition'
        >
          Xem tất cả <ArrowRight className='h-3.5 w-3.5' />
        </Link>
      </div>

      <div className='mt-4 overflow-x-auto'>
        {loading ? (
          <div className='space-y-3 py-2'>
            {[1, 2, 3, 4].map((idx) => (
              <div key={idx} className='h-12 w-full animate-pulse bg-neutral-100' />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className='py-8 text-center text-xs font-bold uppercase text-neutral-400'>
            Chưa có đơn hàng nào
          </div>
        ) : (
          <table className='w-full text-left text-xs'>
            <thead>
              <tr className='border-b border-neutral-200 text-[10px] font-bold uppercase tracking-wider text-neutral-500'>
                <th className='pb-3'>Mã đơn</th>
                <th className='pb-3'>Khách hàng</th>
                <th className='pb-3'>Tổng tiền</th>
                <th className='pb-3'>Thanh toán</th>
                <th className='pb-3'>Trạng thái</th>
                <th className='pb-3 text-right'>Chi tiết</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-neutral-100 font-medium'>
              {orders.map((order) => {
                const badge = statusBadge[order.status] || { label: order.status, class: 'bg-neutral-100 text-neutral-800' }
                return (
                  <tr
                    key={order._id}
                    onClick={() => onSelectOrder && onSelectOrder(order)}
                    className='hover:bg-neutral-50/90 transition cursor-pointer group'
                  >
                    <td className='py-3 font-bold text-neutral-950'>
                      <button
                        type='button'
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectOrder && onSelectOrder(order)
                        }}
                        className='font-mono font-bold text-left hover:underline text-neutral-900 group-hover:text-black'
                      >
                        #{order.order_code}
                      </button>
                      <span className='block text-[10px] font-normal text-neutral-400'>
                        {formatDate(order.createdAt)}
                      </span>
                    </td>
                    <td className='py-3'>
                      <p className='font-bold text-neutral-900'>{order.customerName}</p>
                      <p className='text-[10px] text-neutral-500 truncate max-w-36'>{order.customerEmail}</p>
                    </td>
                    <td className='py-3 font-bold text-neutral-950'>
                      {formatCurrency(order.total_amount)}
                    </td>
                    <td className='py-3'>
                      <span
                        className={`inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          order.payment_status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        {order.payment_method} • {order.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thu'}
                      </span>
                    </td>
                    <td className='py-3'>
                      <span
                        className={`inline-block border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badge.class}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className='py-3 text-right'>
                      <button
                        type='button'
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectOrder && onSelectOrder(order)
                        }}
                        className='inline-flex items-center gap-1 border border-neutral-300 bg-white px-2.5 py-1.5 text-[10px] font-black uppercase text-neutral-900 shadow-sm transition hover:border-black hover:bg-black hover:text-white'
                        title='Mở modal chi tiết đơn hàng'
                      >
                        <Eye className='h-3.5 w-3.5' />
                        <span>Xem</span>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
