import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import ProductCard from '../../components/ProductCard.jsx'
import { getProducts } from '../../services/productApi.js'

const messageOf = (error) => error.response?.data?.message || 'Không thể tải danh sách hàng mới.'

function Skeleton() {
  return <div className='animate-pulse'><div className='aspect-[3/4] bg-neutral-200' /><div className='mt-4 h-3 bg-neutral-200' /><div className='mt-3 h-4 bg-neutral-200' /></div>
}

export default function NewArrivals() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = async () => {
    setLoading(true); setError('')
    try { const { data } = await getProducts({ sort: 'newest', page: 1, limit: 12 }); setProducts(data.data || []) }
    catch (requestError) { setError(messageOf(requestError)) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])
  return <main className='min-h-screen bg-[#faf9f7] text-neutral-950'>
    <div className='mx-auto max-w-[1360px] px-4 py-12 sm:px-6 lg:px-8 lg:py-20'>
      <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className='border-b border-black pb-10'>
        <p className='text-[11px] font-bold uppercase tracking-[0.28em] text-neutral-500'>New arrivals / 2026</p>
        <div className='mt-4 flex flex-col justify-between gap-6 md:flex-row md:items-end'>
          <h1 className='text-3xl font-black uppercase tracking-tight sm:text-5xl lg:text-6xl'>Hàng mới về</h1>
          <p className='max-w-sm text-sm leading-6 text-neutral-600 md:text-right'>Những thiết kế vừa cập bến, được tuyển chọn cho nhịp sống và phong cách đương đại.</p>
        </div>
      </motion.header>
      {loading ? <section className='mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4'>{Array.from({ length: 12 }, (_, index) => <Skeleton key={index} />)}</section>
        : error ? <section className='mt-10 border bg-white py-20 text-center'><h2 className='font-bold uppercase'>Không thể tải hàng mới</h2><p className='mt-3 text-sm text-neutral-500'>{error}</p><button type='button' onClick={load} className='mt-6 bg-black px-6 py-3 text-xs font-bold uppercase text-white'>Thử lại</button></section>
          : products.length === 0 ? <section className='mt-10 border bg-white py-20 text-center'><h2 className='font-bold uppercase'>Chưa có sản phẩm mới</h2><Link to='/collections' className='mt-6 inline-block bg-black px-6 py-3 text-xs font-bold uppercase text-white'>Xem bộ sưu tập</Link></section>
            : <section className='mt-10 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4 lg:gap-y-16' aria-label='Sản phẩm mới nhất'>{products.map((product, index) => <ProductCard key={product._id} product={product} showBadge='new' index={index} />)}</section>}
    </div>
  </main>
}
