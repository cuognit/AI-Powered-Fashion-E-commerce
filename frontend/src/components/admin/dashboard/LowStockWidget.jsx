import { AlertTriangle, ArrowRight, Edit3 } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function LowStockWidget({ products = [], loading }) {
  return (
    <div className='border border-neutral-200 bg-white p-6'>
      <div className='flex items-center justify-between border-b border-neutral-200 pb-4'>
        <div className='flex items-center gap-2'>
          <div className='grid h-7 w-7 place-items-center bg-amber-100 text-amber-800 rounded-sm'>
            <AlertTriangle className='h-4 w-4' />
          </div>
          <div>
            <span className='text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500'>Cảnh báo kho</span>
            <h3 className='text-lg font-black uppercase tracking-tight text-neutral-950'>
              Hàng Sắp Hết Kho
            </h3>
          </div>
        </div>

        <Link
          to='/admin/products'
          className='flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-neutral-600 hover:text-black transition'
        >
          Kho hàng <ArrowRight className='h-3.5 w-3.5' />
        </Link>
      </div>

      <div className='mt-4'>
        {loading ? (
          <div className='space-y-3 py-2'>
            {[1, 2, 3].map((idx) => (
              <div key={idx} className='h-12 w-full animate-pulse bg-neutral-100' />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className='py-8 text-center text-xs font-bold uppercase text-emerald-600'>
            Mọi sản phẩm đều đủ tồn kho an toàn
          </div>
        ) : (
          <div className='divide-y divide-neutral-100'>
            {products.map((item) => (
              <div
                key={item._id}
                className='flex items-center justify-between py-3 hover:bg-neutral-50/80 transition px-1'
              >
                <div className='flex items-center gap-3 min-w-0'>
                  <div className='h-10 w-8 shrink-0 overflow-hidden border border-neutral-200 bg-neutral-100'>
                    {item.image ? (
                      <img src={item.image} alt={item.name} className='h-full w-full object-cover' />
                    ) : (
                      <div className='flex h-full w-full items-center justify-center text-[8px] text-neutral-400'>
                        IMG
                      </div>
                    )}
                  </div>
                  <div className='min-w-0'>
                    <h4 className='truncate text-xs font-bold text-neutral-900'>{item.name}</h4>
                    <p className='text-[10px] text-neutral-500'>{item.category} • {item.variantsCount} biến thể</p>
                  </div>
                </div>

                <div className='flex items-center gap-3 shrink-0 pl-2'>
                  <div className='text-right'>
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                        item.total_stock === 0
                          ? 'bg-rose-100 text-rose-800'
                          : item.total_stock <= 5
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-neutral-100 text-neutral-800'
                      }`}
                    >
                      {item.total_stock === 0 ? 'Hết hàng' : `Còn ${item.total_stock} cái`}
                    </span>
                  </div>
                  <Link
                    to={`/admin/products`}
                    className='grid h-7 w-7 place-items-center border border-neutral-200 bg-white hover:border-black transition'
                    title='Nhập thêm hàng'
                  >
                    <Edit3 className='h-3.5 w-3.5 text-neutral-700' />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
