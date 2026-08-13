import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import FavoriteButton from './FavoriteButton.jsx'
import { formatCurrency } from '../utils/formatCurrency.js'

const FALLBACK_IMAGE = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><rect width="100%" height="100%" fill="#eee"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="28" fill="#777">AESTHETIX</text></svg>')}`

export default function ProductCard({ product, showBadge, index = 0, className = '' }) {
  if (!product) return null
  const price = product.min_price ?? product.sale_price ?? product.base_price
  const maxPrice = product.max_price ?? price
  const sale = product.sale_price != null && product.sale_price < product.base_price && maxPrice === price
  const discount = sale ? Math.round((1 - product.sale_price / product.base_price) * 100) : 0
  const categoryName = product.category_id?.name || product.category?.name || ''
  const waveDelay = (index % 4) * 0.09 + Math.floor((index % 12) / 4) * 0.06

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.6, delay: waveDelay, ease: [0.25, 1, 0.5, 1] }}
      className={`group min-w-0 ${className}`}
    >
      <div className='relative aspect-[3/4] overflow-hidden bg-neutral-100 shadow-sm transition-shadow duration-300 group-hover:shadow-md'>
        <Link to={`/products/${product._id}`} className='block h-full' aria-label={`Xem ${product.name}`}>
          <img
            src={product.images?.[0] || FALLBACK_IMAGE}
            alt={product.name}
            loading='lazy'
            onError={(event) => {
              event.currentTarget.onerror = null
              event.currentTarget.src = FALLBACK_IMAGE
            }}
            className='h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105'
          />
        </Link>
        {showBadge === 'new' ? (
          <span className='absolute left-3 top-3 bg-black px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm'>Mới</span>
        ) : sale ? (
          <span className='absolute left-3 top-3 bg-black px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm'>-{discount}%</span>
        ) : null}
        <FavoriteButton product={product} className='absolute right-3 top-3 z-10 transition-transform duration-200 hover:scale-110' />
      </div>
      <Link to={`/products/${product._id}`} className='block border-t border-neutral-200 pt-3'>
        <div className='flex items-start justify-between gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500'>
          <span>{product.brand || 'AESTHETIX'}</span>
          <span className='text-right'>{categoryName}</span>
        </div>
        <h2 className='mt-2 min-h-10 text-sm font-semibold leading-5 transition-colors duration-200 group-hover:text-black group-hover:underline'>{product.name}</h2>
        <div className='mt-2 flex flex-wrap items-baseline gap-2'>
          <strong className='font-mono text-sm'>
            {maxPrice > price ? `${formatCurrency(price)} – ${formatCurrency(maxPrice)}` : formatCurrency(price)}
          </strong>
          {sale && <span className='font-mono text-xs text-neutral-400 line-through'>{formatCurrency(product.base_price)}</span>}
        </div>
      </Link>
    </motion.article>
  )
}
