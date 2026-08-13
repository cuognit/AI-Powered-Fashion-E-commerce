import { useState } from 'react'
import { Link } from 'react-router-dom'
import FavoriteButton from '../../components/FavoriteButton.jsx'
import ProductQuickView from '../../components/ProductQuickView.jsx'
import useWishlistStore from '../../store/wishlistStore.js'
import { formatCurrency } from '../../utils/formatCurrency.js'

const FALLBACK = 'https://placehold.co/800x1067/f1f1f1/6b6b6b?text=AESTHETIX'

export default function Wishlist() {
  const items = useWishlistStore((state) => state.items)
  const isLoading = useWishlistStore((state) => state.isLoading)
  const error = useWishlistStore((state) => state.error)
  const fetchWishlist = useWishlistStore((state) => state.fetch)
  const [selected, setSelected] = useState(null)

  return <main className='min-h-screen bg-[#f7f6f3] text-black'>
    <div className='mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8 lg:py-20'>
      <header className='flex flex-col gap-6 border-b border-black pb-10 sm:flex-row sm:items-end sm:justify-between'>
        <div><p className='text-[10px] font-bold uppercase tracking-[.28em] text-neutral-500'>AESTHETIX / Saved pieces</p><h1 className='mt-3 text-4xl font-black uppercase tracking-tight sm:text-6xl'>Sản phẩm<br />yêu thích</h1></div>
        <p className='font-mono text-sm uppercase'>{items.length.toString().padStart(2, '0')} sản phẩm</p>
      </header>

      {isLoading ? <section className='mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4'>{Array.from({ length: 8 }, (_, i) => <div key={i} className='animate-pulse'><div className='aspect-[3/4] bg-neutral-200' /><div className='mt-4 h-3 bg-neutral-200' /><div className='mt-3 h-4 bg-neutral-200' /></div>)}</section>
        : error ? <section className='mt-10 border border-black bg-white py-20 text-center'><h2 className='font-bold uppercase'>Không thể tải danh sách</h2><p className='mt-3 text-sm text-neutral-500'>{error}</p><button onClick={() => fetchWishlist().catch(() => {})} className='mt-6 bg-black px-6 py-3 text-xs font-bold uppercase text-white'>Thử lại</button></section>
          : items.length === 0 ? <section className='mt-10 border border-black bg-white px-5 py-24 text-center'><h2 className='text-2xl font-black uppercase'>Chưa có thiết kế nào được lưu</h2><p className='mx-auto mt-3 max-w-md text-sm text-neutral-500'>Khám phá bộ sưu tập và nhấn biểu tượng trái tim để lưu những món đồ bạn yêu thích.</p><Link to='/collections' className='mt-7 inline-block bg-black px-7 py-3 text-xs font-bold uppercase tracking-wider text-white'>Khám phá bộ sưu tập</Link></section>
            : <section className='mt-10 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4 lg:gap-y-16'>
              {items.map((product) => { const inStock = product.status === 'available' && product.variants?.some((v) => v.stock > 0); return <article key={product._id} className='group min-w-0'>
                <div className='relative aspect-[3/4] overflow-hidden bg-neutral-200'>
                  <button type='button' onClick={() => setSelected(product)} className='h-full w-full'><img src={product.images?.[0] || FALLBACK} alt={product.name} className='h-full w-full object-cover transition duration-700 group-hover:scale-105' /></button>
                  <FavoriteButton product={product} className='absolute right-3 top-3' />
                  <span className={`absolute bottom-0 left-0 px-3 py-2 text-[9px] font-bold uppercase ${inStock ? 'bg-white text-black' : 'bg-black text-white'}`}>{inStock ? 'Còn hàng' : 'Hết hàng'}</span>
                </div>
                <button type='button' onClick={() => setSelected(product)} className='mt-4 block w-full text-left'><p className='text-[10px] font-bold uppercase tracking-widest text-neutral-500'>{product.brand}</p><h2 className='mt-2 min-h-10 text-sm font-semibold group-hover:underline'>{product.name}</h2><p className='mt-2 font-mono text-sm font-bold'>{formatCurrency(product.sale_price ?? product.base_price)}</p></button>
              </article> })}
            </section>}
    </div>
    <ProductQuickView product={selected} onClose={() => setSelected(null)} />
  </main>
}
