import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import ProductCard from '../../components/ProductCard.jsx'
import useWishlistStore from '../../store/wishlistStore.js'

export default function Wishlist() {
  const items = useWishlistStore((state) => state.items)
  const isLoading = useWishlistStore((state) => state.isLoading)
  const error = useWishlistStore((state) => state.error)
  const fetchWishlist = useWishlistStore((state) => state.fetch)

  return <main className='min-h-screen bg-[#f7f6f3] text-black'>
    <div className='mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8 lg:py-20'>
      <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className='flex flex-col gap-4 border-b border-black pb-8 sm:flex-row sm:items-end sm:justify-between'>
        <div><p className='text-[10px] font-bold uppercase tracking-[.28em] text-neutral-500'>AESTHETIX / Saved pieces</p><h1 className='mt-2 text-3xl font-black uppercase tracking-tight sm:text-4xl lg:text-5xl'>Sản phẩm yêu thích</h1></div>
        <p className='font-mono text-sm uppercase'>{items.length.toString().padStart(2, '0')} sản phẩm</p>
      </motion.header>

      {isLoading ? <section className='mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4'>{Array.from({ length: 8 }, (_, i) => <div key={i} className='animate-pulse'><div className='aspect-[3/4] bg-neutral-200' /><div className='mt-4 h-3 bg-neutral-200' /><div className='mt-3 h-4 bg-neutral-200' /></div>)}</section>
        : error ? <section className='mt-10 border border-black bg-white py-20 text-center'><h2 className='font-bold uppercase'>Không thể tải danh sách</h2><p className='mt-3 text-sm text-neutral-500'>{error}</p><button onClick={() => fetchWishlist().catch(() => {})} className='mt-6 bg-black px-6 py-3 text-xs font-bold uppercase text-white'>Thử lại</button></section>
          : items.length === 0 ? <section className='mt-10 border border-black bg-white px-5 py-24 text-center'><h2 className='text-2xl font-black uppercase'>Chưa có thiết kế nào được lưu</h2><p className='mx-auto mt-3 max-w-md text-sm text-neutral-500'>Khám phá bộ sưu tập và nhấn biểu tượng trái tim để lưu những món đồ bạn yêu thích.</p><Link to='/collections' className='mt-7 inline-block bg-black px-7 py-3 text-xs font-bold uppercase tracking-wider text-white'>Khám phá bộ sưu tập</Link></section>
            : <section className='mt-10 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4 lg:gap-y-16'>
              {items.map((product, index) => <ProductCard key={product._id} product={product} index={index} />)}
            </section>}
    </div>
  </main>
}
