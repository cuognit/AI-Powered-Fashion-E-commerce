import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye } from 'lucide-react'
import ProductQuickView from '../../components/ProductQuickView.jsx'
import { getProducts } from '../../services/productApi.js'
import { formatCurrency } from '../../utils/formatCurrency.js'
import FavoriteButton from '../../components/FavoriteButton.jsx'

const FALLBACK_IMAGE = 'https://placehold.co/800x1067/f1f1f1/6b6b6b?text=AESTHETIX'
const messageOf = (error) => error.response?.data?.message || 'Không thể tải danh sách hàng mới.'

function ProductImage({ product, className = '' }) {
  return <img src={product.images?.[0] || FALLBACK_IMAGE} alt={product.name} className={className} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = FALLBACK_IMAGE }} />
}

function ProductCard({ product, onQuickView }) {
  const inStock = product.variants?.some((variant) => variant.stock > 0)
  const price = product.sale_price ?? product.base_price
  const hasSale = product.sale_price != null
  return <article className='group min-w-0'>
    <div className='relative aspect-[3/4] overflow-hidden'>
      <button type='button' onClick={() => onQuickView(product)} className='block h-full w-full' aria-label={`Xem nhanh ${product.name}`}>
        <ProductImage product={product} className='h-full w-full object-cover transition duration-700 group-hover:scale-105' />
      </button>
      <span className='absolute left-0 top-0 bg-black px-3 py-2 text-[10px] font-bold uppercase text-white'>Mới</span>
      <FavoriteButton product={product} className='absolute right-3 top-3 z-10' />
      <button type='button' onClick={() => onQuickView(product)} className='absolute inset-x-0 bottom-0 translate-y-full bg-black py-3 text-xs font-bold uppercase text-white transition group-hover:translate-y-0'><Eye className='inline h-4 w-4' /> Xem nhanh</button>
    </div>
    <div className='border-t border-neutral-200 pt-4'>
      <p className='text-[10px] font-bold uppercase tracking-widest text-neutral-500'>{product.brand}</p>
      <button type='button' onClick={() => onQuickView(product)} className='mt-2 block min-h-10 text-left text-sm font-semibold hover:underline'>{product.name}</button>
      <div className='mt-3 flex gap-3 font-mono'><b>{formatCurrency(price)}</b>{hasSale && <span className='text-xs text-neutral-400 line-through'>{formatCurrency(product.base_price)}</span>}</div>
      <span className={`mt-2 block text-[10px] font-bold uppercase ${inStock ? 'text-neutral-500' : 'text-red-600'}`}>{inStock ? 'Còn hàng' : 'Hết hàng'}</span>
    </div>
  </article>
}

function Skeleton() {
  return <div className='animate-pulse'><div className='aspect-[3/4] bg-neutral-200' /><div className='mt-4 h-3 bg-neutral-200' /><div className='mt-3 h-4 bg-neutral-200' /></div>
}

export default function NewArrivals() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const load = async () => {
    setLoading(true); setError('')
    try { const { data } = await getProducts({ sort: 'newest', page: 1, limit: 12 }); setProducts(data.data || []) }
    catch (requestError) { setError(messageOf(requestError)) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])
  return <main className='min-h-screen bg-[#faf9f7] text-neutral-950'>
    <div className='mx-auto max-w-[1360px] px-4 py-12 sm:px-6 lg:px-8 lg:py-20'>
      <header className='border-b border-black pb-10'>
        <p className='text-[11px] font-bold uppercase tracking-[0.28em] text-neutral-500'>New arrivals / 2026</p>
        <div className='mt-4 flex flex-col justify-between gap-6 md:flex-row md:items-end'>
          <h1 className='text-4xl font-bold uppercase tracking-tight sm:text-6xl lg:text-7xl'>Hàng mới về</h1>
          <p className='max-w-sm text-sm leading-6 text-neutral-600 md:text-right'>Những thiết kế vừa cập bến, được tuyển chọn cho nhịp sống và phong cách đương đại.</p>
        </div>
      </header>
      {loading ? <section className='mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4'>{Array.from({ length: 12 }, (_, index) => <Skeleton key={index} />)}</section>
        : error ? <section className='mt-10 border bg-white py-20 text-center'><h2 className='font-bold uppercase'>Không thể tải hàng mới</h2><p className='mt-3 text-sm text-neutral-500'>{error}</p><button type='button' onClick={load} className='mt-6 bg-black px-6 py-3 text-xs font-bold uppercase text-white'>Thử lại</button></section>
          : products.length === 0 ? <section className='mt-10 border bg-white py-20 text-center'><h2 className='font-bold uppercase'>Chưa có sản phẩm mới</h2><Link to='/collections' className='mt-6 inline-block bg-black px-6 py-3 text-xs font-bold uppercase text-white'>Xem bộ sưu tập</Link></section>
            : <section className='mt-10 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4 lg:gap-y-16' aria-label='Sản phẩm mới nhất'>{products.map((product) => <ProductCard key={product._id} product={product} onQuickView={setSelected} />)}</section>}
    </div>
    <ProductQuickView product={selected} onClose={() => setSelected(null)} />
  </main>
}
