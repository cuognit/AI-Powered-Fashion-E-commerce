import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowRight, ChevronLeft, ChevronRight, Minus, Plus, ShoppingBag } from 'lucide-react'
import toast from 'react-hot-toast'
import { getProductById } from '../../services/productApi.js'
import useCartStore from '../../store/cartStore.js'
import FavoriteButton from '../../components/FavoriteButton.jsx'

const getMessage = (error) => error.response?.data?.message || 'Không thể thêm sản phẩm vào giỏ hàng'

export default function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [imageIndex, setImageIndex] = useState(0)
  const [selectedSku, setSelectedSku] = useState('')
  const [quantity, setQuantity] = useState(1)
  const addItem = useCartStore((state) => state.addItem)
  const isMutating = useCartStore((state) => state.isMutating)

  useEffect(() => {
    let active = true
    setLoading(true)
    getProductById(id)
      .then(({ data }) => { if (active) setProduct(data.data || data) })
      .catch(() => { if (active) setError('Không thể tải sản phẩm') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  const selectedVariant = useMemo(
    () => product?.variants?.find((variant) => variant.sku === selectedSku),
    [product, selectedSku],
  )
  const price = product ? (product.sale_price ?? product.base_price) : 0

  const selectVariant = (variant) => {
    if (variant.stock < 1) return
    setSelectedSku(variant.sku)
    setQuantity(1)
  }

  const handleAdd = async () => {
    if (!selectedVariant) return toast.error('Vui lòng chọn màu và kích thước')
    if (quantity < 1 || quantity > selectedVariant.stock) return toast.error('Số lượng không hợp lệ')
    try {
      await addItem(product._id, selectedVariant.sku, quantity)
      toast.success('Đã thêm sản phẩm vào giỏ hàng')
    } catch (requestError) { toast.error(getMessage(requestError)) }
  }

  if (loading) return <div className="min-h-[60vh] grid place-items-center">Đang tải sản phẩm...</div>
  if (error || !product) return <div className="min-h-[60vh] grid place-items-center text-red-600">{error || 'Không tìm thấy sản phẩm'}</div>

  const images = product.images?.length ? product.images : ['https://placehold.co/800x1000?text=Product']

  return (
    <main className="min-h-screen bg-[#f7f6f4] py-10 text-zinc-900">
      <div className="mx-auto grid max-w-[1360px] gap-10 px-4 sm:px-6 lg:px-8 lg:grid-cols-2">
        <section>
          <div className="relative overflow-hidden bg-zinc-100">
            <img src={images[imageIndex]} alt={product.name} className="aspect-[4/5] w-full object-cover" />
            {images.length > 1 && <>
              <button onClick={() => setImageIndex((imageIndex - 1 + images.length) % images.length)} className="absolute left-4 top-1/2 grid h-10 w-10 place-items-center bg-white"><ChevronLeft /></button>
              <button onClick={() => setImageIndex((imageIndex + 1) % images.length)} className="absolute right-4 top-1/2 grid h-10 w-10 place-items-center bg-white"><ChevronRight /></button>
            </>}
          </div>
        </section>

        <section className="space-y-8 lg:sticky lg:top-8 lg:self-start">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[.2em] text-zinc-500">{product.brand}</p>
            <div className="flex items-start justify-between gap-4"><h1 className="text-4xl font-black uppercase leading-tight">{product.name}</h1><FavoriteButton product={product} className="shrink-0" /></div>
            <div className="mt-4 flex items-center gap-3 text-2xl font-bold">
              <span>{price.toLocaleString('vi-VN')} đ</span>
              {product.sale_price != null && <span className="text-base text-zinc-400 line-through">{product.base_price.toLocaleString('vi-VN')} đ</span>}
            </div>
          </div>
          {product.description && <p className="leading-7 text-zinc-600">{product.description}</p>}

          <div>
            <div className="mb-3 flex justify-between text-xs font-bold uppercase tracking-wider">
              <span>Chọn phiên bản</span><span>{selectedVariant ? `${selectedVariant.color} / ${selectedVariant.size}` : 'Bắt buộc'}</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {product.variants?.map((variant) => (
                <button key={variant.sku} disabled={variant.stock < 1} onClick={() => selectVariant(variant)} className={`border p-3 text-left text-sm ${selectedSku === variant.sku ? 'border-black bg-black text-white' : 'bg-white'} disabled:cursor-not-allowed disabled:opacity-40`}>
                  <strong>{variant.color} / {variant.size}</strong>
                  <span className="ml-2 text-xs">{variant.stock > 0 ? `Còn ${variant.stock}` : 'Hết hàng'}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex h-14 items-center border bg-white">
              <button disabled={quantity <= 1} onClick={() => setQuantity((value) => value - 1)} className="grid h-full w-12 place-items-center disabled:opacity-30"><Minus size={16} /></button>
              <span className="w-10 text-center font-bold">{quantity}</span>
              <button disabled={!selectedVariant || quantity >= selectedVariant.stock} onClick={() => setQuantity((value) => value + 1)} className="grid h-full w-12 place-items-center disabled:opacity-30"><Plus size={16} /></button>
            </div>
            <button disabled={isMutating || product.status !== 'available'} onClick={handleAdd} className="flex h-14 flex-1 items-center justify-center gap-2 bg-black px-5 text-sm font-bold uppercase tracking-widest text-white disabled:opacity-50">
              <ShoppingBag size={18} /> {isMutating ? 'Đang thêm...' : 'Thêm vào giỏ'} <ArrowRight size={18} />
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
