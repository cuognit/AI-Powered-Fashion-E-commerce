import { Link } from 'react-router-dom'
import { formatCurrency } from '../../utils/formatCurrency.js'

export default function OrderItemList({ items = [], compact = false }) {
  const visible = compact ? items.slice(0, 2) : items
  return <div className='divide-y divide-neutral-100'>
    {visible.map((item) => <div key={`${item.productId}:${item.variantSku}`} className='flex gap-4 py-4 first:pt-0 last:pb-0'>
      <div className='h-20 w-16 shrink-0 overflow-hidden bg-neutral-100'>{item.image ? <img src={item.image} alt={item.name} className='h-full w-full object-cover' /> : <div className='grid h-full place-items-center text-[9px] font-bold uppercase text-neutral-400'>No image</div>}</div>
      <div className='min-w-0 flex-1'>
        {item.productId ? <Link to={`/products/${item.productId}`} className='line-clamp-2 text-sm font-black uppercase hover:underline'>{item.name}</Link> : <p className='line-clamp-2 text-sm font-black uppercase'>{item.name}</p>}
        <p className='mt-1 text-xs text-neutral-500'>{[item.color, item.size, item.variantSku].filter(Boolean).join(' · ')}</p>
        <p className='mt-2 text-xs font-semibold'>{item.quantity} × {formatCurrency(item.price)}</p>
      </div>
    </div>)}
    {compact && items.length > visible.length && <p className='pt-3 text-xs font-semibold text-neutral-500'>+{items.length - visible.length} sản phẩm khác</p>}
  </div>
}