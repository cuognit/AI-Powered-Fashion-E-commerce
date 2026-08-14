import { ArrowRight, Flame } from 'lucide-react'
import { Link } from 'react-router-dom'

const formatCurrency = (val) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0)

export default function TopProductsTable({ products = [], loading }) {
  return (
    <div className='border border-neutral-200 bg-white p-6'>
      <div className='flex items-center justify-between border-b border-neutral-200 pb-4'>
        <div>
          <div className='flex items-center gap-1.5'>
            <Flame className='h-3.5 w-3.5 text-amber-500' />
            <span className='text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500'>Sản phẩm hot</span>
          </div>
          <h3 className='text-lg font-black uppercase tracking-tight text-neutral-950'>
            Top 5 Sản Phẩm Bán Chạy Nhất
          </h3>
        </div>
        <Link
          to='/admin/products'
          className='flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-neutral-600 hover:text-black transition'
        >
          Tất cả sản phẩm <ArrowRight className='h-3.5 w-3.5' />
        </Link>
      </div>

      <div className='mt-4'>
        {loading ? (
          <div className='space-y-3 py-2'>
            {[1, 2, 3, 4, 5].map((idx) => (
              <div key={idx} className='h-14 w-full animate-pulse bg-neutral-100' />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className='py-8 text-center text-xs font-bold uppercase text-neutral-400'>
            Chưa có dữ liệu sản phẩm bán ra
          </div>
        ) : (
          <div className='divide-y divide-neutral-100'>
            {products.map((prod, index) => (
              <div
                key={prod._id || index}
                className='flex items-center justify-between py-3 transition hover:bg-neutral-50/80 px-1'
              >
                <div className='flex items-center gap-3 min-w-0'>
                  <span className='font-black text-xs text-neutral-400 w-4'>{index + 1}</span>
                  <div className='h-12 w-10 shrink-0 overflow-hidden border border-neutral-200 bg-neutral-100'>
                    {prod.image ? (
                      <img src={prod.image} alt={prod.name} className='h-full w-full object-cover' />
                    ) : (
                      <div className='flex h-full w-full items-center justify-center text-[9px] text-neutral-400'>
                        IMG
                      </div>
                    )}
                  </div>
                  <div className='min-w-0'>
                    <h4 className='truncate text-xs font-bold text-neutral-900'>{prod.name}</h4>
                    <p className='text-[11px] text-neutral-500'>
                      Đơn giá: {formatCurrency(prod.base_price)}
                    </p>
                  </div>
                </div>

                <div className='text-right shrink-0 pl-3'>
                  <p className='text-xs font-black text-neutral-950'>
                    {prod.totalSold} <span className='text-[10px] font-normal text-neutral-500'>đã bán</span>
                  </p>
                  <p className='text-[10px] font-bold text-emerald-600'>
                    {formatCurrency(prod.totalRevenue)}
                  </p>
                  {prod.currentStock !== undefined && (
                    <p className='text-[9px] text-neutral-400'>
                      Còn lại: <span className={prod.currentStock <= 5 ? 'font-bold text-rose-600' : ''}>{prod.currentStock} cái</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
