import { useState } from 'react'
import { ArrowRight, Award, DollarSign, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'

const formatCurrency = (val) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0)

export default function TopCustomersTable({ customers = [], loading }) {
  const [filterType, setFilterType] = useState('revenue') // 'revenue' | 'orders'

  // Sort customers based on selected filter
  const sortedCustomers = [...customers]
    .sort((a, b) => {
      if (filterType === 'orders') {
        if (b.orderCount !== a.orderCount) return b.orderCount - a.orderCount
        return (b.totalSpent || 0) - (a.totalSpent || 0)
      }
      if ((b.totalSpent || 0) !== (a.totalSpent || 0)) return (b.totalSpent || 0) - (a.totalSpent || 0)
      return b.orderCount - a.orderCount
    })
    .slice(0, 5)

  return (
    <div className='border border-neutral-200 bg-white p-6'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-200 pb-4'>
        <div>
          <div className='flex items-center gap-1.5'>
            <Award className='h-3.5 w-3.5 text-amber-500' />
            <span className='text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500'>Khách hàng VIP</span>
          </div>
          <h3 className='text-lg font-black uppercase tracking-tight text-neutral-950'>
            Top Khách Hàng Thân Thiết
          </h3>
        </div>

        <div className='flex items-center gap-1 rounded-sm border border-neutral-300 bg-neutral-100 p-1'>
          <button
            type='button'
            onClick={() => setFilterType('revenue')}
            className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition ${
              filterType === 'revenue'
                ? 'bg-black text-white shadow-sm'
                : 'text-neutral-600 hover:text-black'
            }`}
          >
            <DollarSign className='h-3 w-3' />
            <span>Doanh thu</span>
          </button>
          <button
            type='button'
            onClick={() => setFilterType('orders')}
            className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition ${
              filterType === 'orders'
                ? 'bg-black text-white shadow-sm'
                : 'text-neutral-600 hover:text-black'
            }`}
          >
            <ShoppingBag className='h-3 w-3' />
            <span>Số đơn</span>
          </button>
        </div>
      </div>

      <div className='mt-4'>
        {loading ? (
          <div className='space-y-3 py-2'>
            {[1, 2, 3, 4, 5].map((idx) => (
              <div key={idx} className='h-14 w-full animate-pulse bg-neutral-100' />
            ))}
          </div>
        ) : sortedCustomers.length === 0 ? (
          <div className='py-8 text-center text-xs font-bold uppercase text-neutral-400'>
            Chưa có dữ liệu khách hàng mua hàng
          </div>
        ) : (
          <div className='divide-y divide-neutral-100'>
            {sortedCustomers.map((cust, index) => {
              const displayName = cust.name || 'Khách hàng'
              const initial = displayName.charAt(0).toUpperCase()
              return (
                <div
                  key={cust._id || index}
                  className='flex items-center justify-between py-3 transition hover:bg-neutral-50/80 px-1'
                >
                  <div className='flex items-center gap-3 min-w-0'>
                    <span className='font-black text-xs text-neutral-400 w-4'>{index + 1}</span>
                    <div className='grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black font-black text-white text-xs'>
                      {initial}
                    </div>
                    <div className='min-w-0'>
                      <div className='flex items-center gap-1.5'>
                        <h4 className='truncate text-xs font-bold text-neutral-900'>{displayName}</h4>
                        {cust.completedOrders > 2 && (
                          <span className='inline-flex items-center px-1.5 py-0.2 text-[8px] font-bold uppercase bg-amber-100 text-amber-900 rounded'>
                            VIP
                          </span>
                        )}
                      </div>
                      <p className='text-[11px] text-neutral-500 truncate max-w-44'>
                        {cust.email || cust.phone || 'Chưa cập nhật'}
                      </p>
                    </div>
                  </div>

                  <div className='text-right shrink-0 pl-3'>
                    {filterType === 'revenue' ? (
                      <>
                        <p className='text-xs font-black text-neutral-950'>
                          {formatCurrency(cust.totalSpent)}
                        </p>
                        <p className='text-[10px] text-neutral-500 font-medium'>
                          {cust.orderCount} đơn ({cust.completedOrders} thành công)
                        </p>
                      </>
                    ) : (
                      <>
                        <p className='text-xs font-black text-neutral-950'>
                          {cust.orderCount} <span className='text-[10px] font-normal text-neutral-500'>đơn hàng</span>
                        </p>
                        <p className='text-[10px] font-bold text-emerald-600'>
                          {formatCurrency(cust.totalSpent)}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className='mt-4 border-t border-neutral-100 pt-3 flex justify-between items-center text-xs'>
        <span className='text-[10px] font-bold uppercase tracking-wider text-neutral-500'>
          Xếp theo: {filterType === 'revenue' ? 'Tổng chi tiêu cao nhất' : 'Số đơn đặt nhiều nhất'}
        </span>
        <Link
          to='/admin/customers'
          className='flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-neutral-700 hover:text-black transition'
        >
          Xem tất cả <ArrowRight className='h-3.5 w-3.5' />
        </Link>
      </div>
    </div>
  )
}
