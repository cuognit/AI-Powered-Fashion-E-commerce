import { useState, useEffect } from 'react'
import { X, Search, Sparkles, Check, Shirt, Filter } from 'lucide-react'
import { getProducts, getProductFacets } from '../../services/productApi.js'
import { formatCurrency } from '../../utils/formatCurrency.js'

export default function ProductPickerModal({ isOpen, onClose, onSelectProduct }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)
  const [selectedVariant, setSelectedVariant] = useState(null)

  // Tải danh mục khi mở modal
  useEffect(() => {
    if (isOpen) {
      getProductFacets()
        .then(({ data }) => {
          if (data?.data?.categories) {
            setCategories(data.data.categories)
          }
        })
        .catch(() => {})
    }
  }, [isOpen])

  // Tải danh sách sản phẩm theo tìm kiếm / danh mục
  useEffect(() => {
    if (!isOpen) return

    let isMounted = true
    setLoading(true)

    const params = {
      limit: 20,
    }
    if (searchQuery.trim()) {
      params.search = searchQuery.trim()
    }
    if (selectedCategory) {
      params.category = selectedCategory
    }

    getProducts(params)
      .then(({ data }) => {
        if (isMounted) {
          const list = data?.data || data?.products || []
          setProducts(list)
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error('Lỗi tải sản phẩm:', err)
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [isOpen, searchQuery, selectedCategory])

  // Xử lý chọn sản phẩm
  const handleProductClick = (product) => {
    setSelectedProduct(product)
    const mainImg = product.image_assets?.[0]?.url || product.images?.[0] || ''
    setSelectedImage(mainImg)
    setSelectedVariant(product.variants?.[0] || null)
  }

  // Xác nhận lựa chọn
  const handleConfirm = () => {
    if (!selectedProduct || !selectedImage) return
    onSelectProduct({
      product: selectedProduct,
      garmentImage: selectedImage,
      variant: selectedVariant,
      title: `${selectedProduct.name} ${selectedProduct.brand ? `(${selectedProduct.brand})` : ''}`,
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                <Shirt size={18} />
              </span>
              <h3 className="text-lg font-black uppercase tracking-tight text-gray-900">
                Chọn trang phục từ Shop
              </h3>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Chọn bất kỳ sản phẩm hoặc mẫu mã có sẵn trong cửa hàng để AI thử lên người bạn.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filters Bar */}
        <div className="p-4 bg-gray-50/70 border-b border-gray-100 flex flex-wrap gap-3 items-center">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên sản phẩm, phong cách..."
              className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-black transition"
            />
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar py-1">
            <button
              type="button"
              onClick={() => setSelectedCategory('')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === ''
                  ? 'bg-black text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-black'
              }`}
            >
              Tất cả
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id || cat.slug}
                type="button"
                onClick={() => setSelectedCategory(cat.slug || cat._id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  selectedCategory === (cat.slug || cat._id)
                    ? 'bg-black text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-black'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body: Products Grid & Selected Preview */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse space-y-2">
                  <div className="aspect-[3/4] bg-gray-200 rounded-2xl" />
                  <div className="h-3 bg-gray-200 rounded-md w-3/4" />
                  <div className="h-4 bg-gray-200 rounded-md w-1/2" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <Shirt className="w-12 h-12 mx-auto mb-3 text-gray-300 stroke-1" />
              <p className="font-semibold text-sm text-gray-600">Không tìm thấy sản phẩm nào</p>
              <p className="text-xs text-gray-400 mt-1">Hãy thử tìm kiếm với từ khóa khác</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {products.map((product) => {
                const img = product.image_assets?.[0]?.url || product.images?.[0] || ''
                const isSelected = selectedProduct?._id === product._id
                const price = product.sale_price || product.base_price || 0

                return (
                  <div
                    key={product._id}
                    onClick={() => handleProductClick(product)}
                    className={`group relative rounded-2xl overflow-hidden border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-purple-600 ring-2 ring-purple-600/30 bg-purple-50/20'
                        : 'border-gray-100 hover:border-gray-300 bg-white hover:shadow-md'
                    }`}
                  >
                    <div className="aspect-[3/4] overflow-hidden bg-gray-100 relative">
                      <img
                        src={img}
                        alt={product.name}
                        className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                      />
                      {isSelected && (
                        <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-md">
                          <Check size={14} />
                        </div>
                      )}
                    </div>

                    <div className="p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 truncate">
                        {product.brand || 'AESTHETIX'}
                      </p>
                      <h4 className="text-xs font-bold text-gray-900 truncate mt-0.5" title={product.name}>
                        {product.name}
                      </h4>
                      <p className="text-xs font-mono font-bold text-purple-700 mt-1">
                        {formatCurrency(price)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer with Selected Item Details & Confirm Button */}
        <div className="p-5 border-t border-gray-100 bg-white flex flex-wrap items-center justify-between gap-4">
          {selectedProduct ? (
            <div className="flex items-center gap-3">
              <img
                src={selectedImage}
                alt={selectedProduct.name}
                className="w-12 h-12 rounded-xl object-cover border border-gray-200"
              />
              <div className="max-w-[280px] sm:max-w-md">
                <p className="text-xs font-bold text-gray-900 truncate">{selectedProduct.name}</p>
                <p className="text-[11px] text-gray-500">
                  {formatCurrency(selectedProduct.sale_price || selectedProduct.base_price || 0)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">Vui lòng nhấp chọn 1 trang phục ở trên</p>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
            >
              Đóng
            </button>
            <button
              type="button"
              disabled={!selectedProduct}
              onClick={handleConfirm}
              className="px-6 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-purple-200"
            >
              Chọn trang phục này
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
