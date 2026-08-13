import { useState } from 'react'
import { ShoppingBag, X } from 'lucide-react'
import toast from 'react-hot-toast'
import useCartStore from '../store/cartStore.js'
import FavoriteButton from './FavoriteButton.jsx'

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600'

export default function ProductQuickView({ product, onClose }) {
  const [selectedVariantSku, setSelectedVariantSku] = useState('')
  const [quantity, setQuantity] = useState(1)
  const addItem = useCartStore((state) => state.addItem)
  const busy = useCartStore((state) => state.isMutating)
  if (!product) return null
  const selectedVariant = product.variants?.find((variant) => variant.sku === selectedVariantSku)
  const addToCart = async () => {
    if (!selectedVariant) return toast.error('Vui lòng chọn phiên bản sản phẩm')
    try {
      await addItem(product._id, selectedVariant.sku, quantity)
      toast.success('Đã thêm vào giỏ hàng')
      onClose()
    } catch (error) { toast.error(error.response?.data?.message || 'Không thể thêm vào giỏ hàng') }
  }

  return <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm' onMouseDown={(event) => event.target === event.currentTarget && onClose()} role='dialog' aria-modal='true'>
    <div className='relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden border border-neutral-300 bg-white shadow-2xl md:flex-row'>
      <button type='button' onClick={onClose} className='absolute right-4 top-4 z-10 border border-neutral-300 bg-white p-2 text-black transition-colors hover:bg-black hover:text-white' aria-label='Đóng'><X className='h-5 w-5' /></button>
      <FavoriteButton product={product} className='absolute right-16 top-4 z-10' />
      <div className='flex min-h-[300px] items-center justify-center bg-neutral-100 p-4 md:w-1/2'>
        <img src={product.images?.[0] || FALLBACK_IMAGE} alt={product.name} className='max-h-[400px] w-full object-cover' onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = FALLBACK_IMAGE }} />
      </div>
      <div className='flex max-h-[50vh] flex-col overflow-y-auto p-6 md:max-h-[90vh] md:w-1/2 md:p-8'>
        <div className='mb-2 flex items-center gap-2'><span className='border border-black bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-black'>{product.brand}</span><span className='text-xs text-neutral-400'>• ID: {product._id}</span></div>
        <h2 className='mb-3 text-xl font-bold leading-snug text-black md:text-2xl'>{product.name}</h2>
        <div className='mb-6 flex items-baseline gap-3 border-y border-neutral-200 bg-neutral-50 p-3.5'>
          {product.sale_price ? <><span className='text-2xl font-extrabold text-black'>{product.sale_price.toLocaleString('vi-VN')} đ</span><span className='text-sm text-neutral-400 line-through'>{product.base_price.toLocaleString('vi-VN')} đ</span></> : <span className='text-2xl font-extrabold text-black'>{product.base_price.toLocaleString('vi-VN')} đ</span>}
        </div>
        <div className='mb-6'><h4 className='mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500'>Mô tả sản phẩm</h4><p className='text-sm leading-relaxed text-neutral-600'>{product.description || 'Sản phẩm thời trang cao cấp được thiết kế theo xu hướng mới nhất, sử dụng chất liệu an toàn, thoáng mát.'}</p></div>
        <div className='mb-6'><h4 className='mb-3 text-xs font-bold uppercase tracking-wider text-neutral-500'>Phiên bản có sẵn</h4><div className='space-y-2'>
          {product.variants?.length ? product.variants.map((variant) => <button type='button' key={variant.sku} disabled={variant.stock < 1} onClick={() => { setSelectedVariantSku(variant.sku); setQuantity(1) }} className={`flex w-full items-center justify-between border p-2.5 text-xs transition-colors disabled:opacity-40 ${selectedVariantSku === variant.sku ? 'border-black bg-black text-white' : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-black'}`}><span><b>{variant.color} / {variant.size}</b> · SKU: {variant.sku}</span><span>{variant.stock > 0 ? `Còn ${variant.stock}` : 'Hết hàng'}</span></button>) : <p className='text-xs italic text-neutral-400'>Không có thông tin phiên bản</p>}
        </div></div>
        <div className='mb-3 flex items-center gap-3'><button type='button' disabled={quantity <= 1} onClick={() => setQuantity((value) => value - 1)} className='h-10 w-10 border disabled:opacity-30'>-</button><span className='w-8 text-center font-bold'>{quantity}</span><button type='button' disabled={!selectedVariant || quantity >= selectedVariant.stock} onClick={() => setQuantity((value) => value + 1)} className='h-10 w-10 border disabled:opacity-30'>+</button></div>
        <button type='button' disabled={product.status === 'out_of_stock' || busy} onClick={addToCart} className='mt-auto flex items-center justify-center gap-2 bg-black py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:bg-neutral-300'><ShoppingBag className='h-4 w-4' />{busy ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}</button>
      </div>
    </div>
  </div>
}
