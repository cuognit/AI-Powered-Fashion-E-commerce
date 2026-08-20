import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import FavoriteButton from './FavoriteButton.jsx'
import { formatCurrency } from '../utils/formatCurrency.js'

const FALLBACK_IMAGE = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><rect width="100%" height="100%" fill="#eee"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="28" fill="#777">AESTHETIX</text></svg>')}`

function formatSoldCount(count) {
  if (!count || count <= 0) return '0'
  if (count >= 1000) {
    const k = (count / 1000).toFixed(1)
    return k.endsWith('.0') ? `${Math.floor(count / 1000)}k` : `${k}k`
  }
  return `${count}`
}

export default function ProductCard({ product, showBadge, index = 0, className = '' }) {
  if (!product) return null
  const price = product.min_price ?? product.sale_price ?? product.base_price
  const maxPrice = product.max_price ?? price
  const sale = product.sale_price != null && product.sale_price < product.base_price && maxPrice === price
  const discount = sale ? Math.round((1 - product.sale_price / product.base_price) * 100) : 0
  const categoryName = product.category_id?.name || product.category?.name || ''
  const waveDelay = (index % 4) * 0.09 + Math.floor((index % 12) / 4) * 0.06

  const soldCount = Number(product.sold_count ?? product.unitsSold ?? product.sold ?? 0)
  const rating = Number(product.average_rating ?? product.rating ?? product.reviewSummary?.average ?? 0)
  const hasSold = soldCount > 0
  const hasRating = rating > 0
  const hasStats = hasSold || hasRating

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

        {/* Top-left Badges Container */}
        <div className='absolute left-2.5 top-2.5 z-10 flex flex-col items-start gap-1.5 pointer-events-none'>
          {showBadge === 'new' ? (
            <span className='bg-black px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm'>
              Mới
            </span>
          ) : sale ? (
            <span className='bg-black px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm'>
              -{discount}%
            </span>
          ) : null}

          {hasStats && (
            <div className='flex items-center gap-1.5 rounded-none bg-black/75 backdrop-blur-md px-2 py-1 text-[10px] font-medium text-white shadow-md border border-white/15'>
              {hasRating && (
                <span className='flex items-center gap-0.5 text-amber-400 font-bold'>
                  <Star className='h-3 w-3 fill-amber-400 text-amber-400 inline-block shrink-0' />
                  <span className='text-white tracking-tight'>{rating.toFixed(1)}</span>
                </span>
              )}
              {hasRating && hasSold && <span className='text-white/40'>|</span>}
              {hasSold && (
                <span className='text-neutral-200 tracking-tight font-normal'>
                  Đã bán {formatSoldCount(soldCount)}
                </span>
              )}
            </div>
          )}
        </div>

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
