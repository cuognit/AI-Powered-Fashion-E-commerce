import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Sparkles,
  Upload,
  Shirt,
  User,
  Image as ImageIcon,
  RefreshCw,
  Download,
  ShoppingBag,
  Check,
  SlidersHorizontal,
  ChevronRight,
  Info,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import useAuth from '../../hooks/useAuth.js'
import useCartStore from '../../store/cartStore.js'
import { getProductById } from '../../services/productApi.js'
import vtonApi from '../../services/vtonApi.js'
import { getSocket } from '../../services/socket.js'
import { formatCurrency } from '../../utils/formatCurrency.js'

import BeforeAfterSlider from '../../components/vton/BeforeAfterSlider.jsx'
import TryOnProcessingState from '../../components/vton/TryOnProcessingState.jsx'
import ProductPickerModal from '../../components/vton/ProductPickerModal.jsx'
import TryOnHistoryDrawer from '../../components/vton/TryOnHistoryDrawer.jsx'

export default function AITryOn() {
  const { isAuthenticated } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const addItemToCart = useCartStore((state) => state.addItem)

  // 1. Quản lý ảnh người mẫu (Person)
  const [personTab, setPersonTab] = useState('samples') // 'samples' | 'upload'
  const [sampleModels, setSampleModels] = useState([])
  const [selectedModel, setSelectedModel] = useState(null)
  const [personFile, setPersonFile] = useState(null)
  const [personPreview, setPersonPreview] = useState(null)
  const personInputRef = useRef(null)

  // 2. Quản lý trang phục (Garment)
  const [garmentTab, setGarmentTab] = useState('shop') // 'shop' | 'upload'
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedGarmentImage, setSelectedGarmentImage] = useState(null)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [customGarmentFile, setCustomGarmentFile] = useState(null)
  const [customGarmentPreview, setCustomGarmentPreview] = useState(null)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const garmentInputRef = useRef(null)

  // 3. Tùy chọn nâng cao (Parameters)
  const [category, setCategory] = useState('upper_body') // 'upper_body' | 'lower_body' | 'dresses'
  const [denoiseSteps, setDenoiseSteps] = useState(30)
  const [autoCrop, setAutoCrop] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // 4. Trạng thái thực thi & Kết quả (Execution & Result)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentTaskId, setCurrentTaskId] = useState(null)
  const [resultData, setResultData] = useState(null)
  const [refreshHistoryTrigger, setRefreshHistoryTrigger] = useState(0)
  const pollingRef = useRef(null)

  // Tải danh sách người mẫu mẫu từ API
  useEffect(() => {
    vtonApi
      .getSampleModels()
      .then(({ data }) => {
        if (data?.data && data.data.length > 0) {
          setSampleModels(data.data)
          setSelectedModel(data.data[0]) // Mặc định chọn người mẫu đầu tiên
        }
      })
      .catch((err) => {
        console.warn('Không thể tải danh sách sample models:', err.message)
      })
  }, [])

  // Tự động nhận diện sản phẩm nếu truy cập từ URL ?productId=...
  useEffect(() => {
    const productId = searchParams.get('productId')
    const sku = searchParams.get('variant')

    if (productId) {
      getProductById(productId)
        .then(({ data }) => {
          const product = data?.data || data
          if (product) {
            setSelectedProduct(product)
            const mainImg = product.image_assets?.[0]?.url || product.images?.[0] || ''
            setSelectedGarmentImage(mainImg)

            if (sku && product.variants) {
              const matched = product.variants.find((v) => v.sku === sku)
              if (matched) setSelectedVariant(matched)
            } else if (product.variants?.length > 0) {
              setSelectedVariant(product.variants[0])
            }

            // Tự động suy luận danh mục theo tên sản phẩm nếu có thể
            const lowerName = (product.name || '').toLowerCase()
            if (lowerName.includes('váy') || lowerName.includes('đầm') || lowerName.includes('dress')) {
              setCategory('dresses')
            } else if (
              lowerName.includes('quần') ||
              lowerName.includes('chân váy') ||
              lowerName.includes('pants') ||
              lowerName.includes('skirt')
            ) {
              setCategory('lower_body')
            } else {
              setCategory('upper_body')
            }

            setGarmentTab('shop')
            toast.success(`Đã chọn: ${product.name}`)
          }
        })
        .catch(() => {
          console.warn('Không tìm thấy sản phẩm từ query param')
        })
    }
  }, [searchParams])

  // Lắng nghe sự kiện Socket.io cập nhật tiến độ Task
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleStatusUpdate = (task) => {
      if (task.taskId === currentTaskId || task._id === currentTaskId) {
        if (task.status === 'completed') {
          setIsProcessing(false)
          setResultData({
            resultImage: task.resultImage || task.result_image,
            personImage: getActivePersonImage(),
            garmentImage: getActiveGarmentImage(),
          })
          setRefreshHistoryTrigger((prev) => prev + 1)
          toast.success('AI thử đồ thành công!')
          if (pollingRef.current) clearInterval(pollingRef.current)
        } else if (task.status === 'failed') {
          setIsProcessing(false)
          toast.error(task.errorMessage || task.error_message || 'Thử đồ thất bại, vui lòng thử lại.')
          if (pollingRef.current) clearInterval(pollingRef.current)
        }
      }
    }

    socket.on('vton:status_update', handleStatusUpdate)

    return () => {
      socket.off('vton:status_update', handleStatusUpdate)
    }
  }, [currentTaskId])

  // Helper lấy ảnh người mẫu đang kích hoạt
  const getActivePersonImage = () => {
    if (personTab === 'upload' && personPreview) return personPreview
    return selectedModel?.imageUrl || ''
  }

  // Helper lấy ảnh trang phục đang kích hoạt
  const getActiveGarmentImage = () => {
    if (garmentTab === 'upload' && customGarmentPreview) return customGarmentPreview
    return selectedGarmentImage || ''
  }

  // Xử lý upload ảnh người dùng
  const handlePersonFileUpload = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh (JPG, PNG, WEBP)')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Dung lượng ảnh tối đa 10MB')
      return
    }

    setPersonFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setPersonPreview(e.target.result)
      setPersonTab('upload')
    }
    reader.readAsDataURL(file)
  }

  // Xử lý upload ảnh trang phục tùy chỉnh
  const handleGarmentFileUpload = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh (JPG, PNG, WEBP)')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Dung lượng ảnh tối đa 10MB')
      return
    }

    setCustomGarmentFile(file)
    setSelectedProduct(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      setCustomGarmentPreview(e.target.result)
      setGarmentTab('upload')
    }
    reader.readAsDataURL(file)
  }

  // Bắt đầu quá trình thử đồ AI
  const handleStartTryOn = async () => {
    const activePerson = getActivePersonImage()
    const activeGarment = getActiveGarmentImage()

    if (!activePerson) {
      toast.error('Vui lòng chọn hoặc tải lên ảnh người mẫu/chân dung')
      return
    }

    if (!activeGarment && !selectedProduct) {
      toast.error('Vui lòng chọn trang phục từ shop hoặc tải ảnh trang phục')
      return
    }

    setIsProcessing(true)
    setResultData(null)

    const formData = new FormData()

    // 1. Ảnh người mẫu
    if (personTab === 'upload' && personFile) {
      formData.append('person_image', personFile)
    } else {
      formData.append('person_image', activePerson)
    }

    // 2. Ảnh trang phục
    if (garmentTab === 'upload' && customGarmentFile) {
      formData.append('garment_image', customGarmentFile)
    } else if (selectedProduct) {
      formData.append('product_id', selectedProduct._id)
      if (selectedGarmentImage) {
        formData.append('garment_image', selectedGarmentImage)
      }
    } else if (activeGarment) {
      formData.append('garment_image', activeGarment)
    }

    formData.append('category', category)
    formData.append('denoise_steps', String(denoiseSteps))
    formData.append('auto_crop', String(autoCrop))

    try {
      // Ưu tiên gọi API tạo Task bất đồng bộ (Submit) để trải nghiệm mượt mà không lo timeout
      const { data } = await vtonApi.submitTryOnTask(formData)
      const taskId = data?.data?.taskId

      if (taskId) {
        setCurrentTaskId(taskId)

        // Fallback polling mỗi 4 giây phòng trường hợp Socket bị gián đoạn
        if (pollingRef.current) clearInterval(pollingRef.current)
        pollingRef.current = setInterval(async () => {
          try {
            const statusRes = await vtonApi.getTryOnTaskStatus(taskId)
            const task = statusRes.data?.data
            if (task?.status === 'completed') {
              clearInterval(pollingRef.current)
              setIsProcessing(false)
              setResultData({
                resultImage: task.resultImage,
                personImage: activePerson,
                garmentImage: activeGarment,
              })
              setRefreshHistoryTrigger((prev) => prev + 1)
              toast.success('AI thử đồ thành công!')
            } else if (task?.status === 'failed') {
              clearInterval(pollingRef.current)
              setIsProcessing(false)
              toast.error(task.errorMessage || 'Xử lý AI thất bại. Vui lòng thử lại.')
            }
          } catch (pollErr) {
            console.warn('Lỗi kiểm tra task status:', pollErr.message)
          }
        }, 4000)
      }
    } catch (err) {
      setIsProcessing(false)
      const message = err.response?.data?.message || err.message || 'Không thể bắt đầu thử đồ'
      toast.error(message)
    }
  }

  // Thêm sản phẩm đang thử vào giỏ hàng
  const handleAddToCart = async () => {
    if (!selectedProduct) {
      toast.error('Đây là trang phục tải ngoài, không có trong shop')
      return
    }

    try {
      const variantSku = selectedVariant?.sku || selectedProduct.variants?.[0]?.sku || ''
      await addItemToCart(selectedProduct._id, variantSku, 1)
      toast.success('Đã thêm trang phục này vào giỏ hàng!')
    } catch (err) {
      toast.error(err.message || 'Không thể thêm vào giỏ hàng')
    }
  }

  // Tải ảnh HD về máy
  const handleDownloadImage = async () => {
    if (!resultData?.resultImage) return

    try {
      const response = await fetch(resultData.resultImage)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `AESTHETIX_TryOn_${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
      toast.success('Đang tải ảnh về máy...')
    } catch (err) {
      window.open(resultData.resultImage, '_blank')
    }
  }

  // Xem lại một bản ghi từ lịch sử
  const handleSelectHistoryItem = (item) => {
    setResultData({
      resultImage: item.result_image,
      personImage: item.person_image,
      garmentImage: item.garment_image,
    })
    if (item.product) {
      setSelectedProduct(item.product)
    }
    toast.success('Đã nạp kết quả từ lịch sử lên màn hình!')
  }

  return (
    <div className="min-h-screen bg-[#FAF9F7] text-neutral-900 pb-24">
      {/* Product Picker Modal */}
      <ProductPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelectProduct={({ product, garmentImage, variant }) => {
          setSelectedProduct(product)
          setSelectedGarmentImage(garmentImage)
          setSelectedVariant(variant)
          setGarmentTab('shop')
        }}
      />

      {/* Header Banner */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Virtual Try-On Studio 2.0</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-gray-900">
                Phòng Thử Đồ Ảo AI
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-xl">
                Trải nghiệm ướm thử trang phục chân thực lên vóc dáng cá nhân hoặc người mẫu chỉ trong tích tắc với sức mạnh mô hình IDM-VTON.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsPickerOpen(true)}
                className="flex items-center gap-2 px-5 py-3 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-2xl hover:bg-gray-800 transition shadow-sm cursor-pointer"
              >
                <Shirt size={16} />
                <span>Chọn đồ từ Shop</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace: 3 Columns Grid */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* CỘT TRÁI (4 CỘT): TÙY CHỌN ĐẦU VÀO (PERSON + GARMENT + SETTINGS) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* CARD 1: CHỌN ẢNH NGƯỜI MẪU / CHÂN DUNG */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                    <User size={16} />
                  </span>
                  <h3 className="text-sm font-black uppercase tracking-tight text-gray-900">
                    1. Ảnh Chân Dung / Người Mẫu
                  </h3>
                </div>
                
                {/* Tabs */}
                <div className="flex bg-gray-100 p-0.5 rounded-xl text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setPersonTab('samples')}
                    className={`px-3 py-1 rounded-lg transition ${
                      personTab === 'samples' ? 'bg-white text-black shadow-xs' : 'text-gray-500 hover:text-black'
                    }`}
                  >
                    Mẫu có sẵn
                  </button>
                  <button
                    type="button"
                    onClick={() => setPersonTab('upload')}
                    className={`px-3 py-1 rounded-lg transition ${
                      personTab === 'upload' ? 'bg-white text-black shadow-xs' : 'text-gray-500 hover:text-black'
                    }`}
                  >
                    Tự tải ảnh
                  </button>
                </div>
              </div>

              {/* Tab Content: Sample Models */}
              {personTab === 'samples' && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500">Chọn một người mẫu phù hợp để thử nhanh:</p>
                  <div className="grid grid-cols-4 gap-2.5">
                    {sampleModels.map((model) => {
                      const isSelected = selectedModel?.id === model.id
                      return (
                        <div
                          key={model.id}
                          onClick={() => setSelectedModel(model)}
                          className={`group relative rounded-2xl overflow-hidden aspect-[3/4] cursor-pointer border-2 transition-all ${
                            isSelected
                              ? 'border-purple-600 ring-2 ring-purple-600/30'
                              : 'border-transparent hover:border-gray-300'
                          }`}
                        >
                          <img
                            src={model.imageUrl}
                            alt={model.name}
                            className="w-full h-full object-cover"
                          />
                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-xs">
                              <Check size={12} />
                            </div>
                          )}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 text-center">
                            <p className="text-[10px] font-bold text-white truncate">{model.name}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Tab Content: Upload My Photo */}
              {personTab === 'upload' && (
                <div className="space-y-3">
                  <input
                    ref={personInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePersonFileUpload(e.target.files?.[0])}
                  />

                  {personPreview ? (
                    <div className="relative rounded-2xl overflow-hidden aspect-[3/4] border border-gray-200 group">
                      <img src={personPreview} alt="Uploaded Person" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => personInputRef.current?.click()}
                          className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded-xl shadow-md hover:bg-gray-100"
                        >
                          Thay đổi ảnh
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => personInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault()
                        handlePersonFileUpload(e.dataTransfer.files?.[0])
                      }}
                      className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-purple-500 hover:bg-purple-50/20 transition cursor-pointer bg-gray-50/50"
                    >
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="font-bold text-xs text-gray-800">Kéo thả hoặc bấm để tải ảnh</p>
                      <p className="text-[10px] text-gray-400 mt-1">Ảnh đứng toàn thân hoặc nửa người (tối đa 10MB)</p>
                    </div>
                  )}

                  <div className="p-3 bg-amber-50 rounded-2xl flex items-start gap-2 text-amber-800 text-[11px]">
                    <Info size={14} className="shrink-0 mt-0.5" />
                    <span>Mẹo: Ảnh đủ sáng, phông nền đơn giản và tư thế đứng thẳng sẽ cho kết quả chuẩn xác nhất!</span>
                  </div>
                </div>
              )}
            </div>

            {/* CARD 2: CHỌN TRANG PHỤC (GARMENT) */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                    <Shirt size={16} />
                  </span>
                  <h3 className="text-sm font-black uppercase tracking-tight text-gray-900">
                    2. Trang Phục Thử Đồ
                  </h3>
                </div>

                <div className="flex bg-gray-100 p-0.5 rounded-xl text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setGarmentTab('shop')}
                    className={`px-3 py-1 rounded-lg transition ${
                      garmentTab === 'shop' ? 'bg-white text-black shadow-xs' : 'text-gray-500 hover:text-black'
                    }`}
                  >
                    Từ Shop
                  </button>
                  <button
                    type="button"
                    onClick={() => setGarmentTab('upload')}
                    className={`px-3 py-1 rounded-lg transition ${
                      garmentTab === 'upload' ? 'bg-white text-black shadow-xs' : 'text-gray-500 hover:text-black'
                    }`}
                  >
                    Tải riêng
                  </button>
                </div>
              </div>

              {/* Garment: From Shop */}
              {garmentTab === 'shop' && (
                <div className="space-y-3">
                  {selectedProduct && selectedGarmentImage ? (
                    <div className="flex gap-3 p-3 bg-purple-50/40 rounded-2xl border border-purple-100 items-center">
                      <img
                        src={selectedGarmentImage}
                        alt={selectedProduct.name}
                        className="w-16 h-20 rounded-xl object-cover border border-purple-200"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600">
                          {selectedProduct.brand || 'AESTHETIX'}
                        </p>
                        <h4 className="text-xs font-bold text-gray-900 truncate" title={selectedProduct.name}>
                          {selectedProduct.name}
                        </h4>
                        <p className="text-xs font-mono font-bold text-gray-900 mt-0.5">
                          {formatCurrency(selectedProduct.sale_price || selectedProduct.base_price || 0)}
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsPickerOpen(true)}
                          className="text-[11px] font-bold text-purple-700 hover:underline mt-1 cursor-pointer block"
                        >
                          Đổi trang phục khác ➔
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsPickerOpen(true)}
                      className="w-full border-2 border-dashed border-purple-200 bg-purple-50/30 rounded-2xl p-6 text-center hover:bg-purple-50/70 transition cursor-pointer"
                    >
                      <Shirt className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <p className="font-bold text-xs text-purple-900">Mở danh mục để chọn sản phẩm</p>
                      <p className="text-[10px] text-purple-500 mt-1">Duyệt hàng trăm mẫu áo, quần, váy mới nhất</p>
                    </button>
                  )}
                </div>
              )}

              {/* Garment: Custom Upload */}
              {garmentTab === 'upload' && (
                <div className="space-y-3">
                  <input
                    ref={garmentInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleGarmentFileUpload(e.target.files?.[0])}
                  />

                  {customGarmentPreview ? (
                    <div className="relative rounded-2xl overflow-hidden aspect-[3/4] border border-gray-200 group">
                      <img src={customGarmentPreview} alt="Custom Garment" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => garmentInputRef.current?.click()}
                          className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded-xl shadow-md hover:bg-gray-100"
                        >
                          Đổi ảnh trang phục
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => garmentInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault()
                        handleGarmentFileUpload(e.dataTransfer.files?.[0])
                      }}
                      className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-purple-500 hover:bg-purple-50/20 transition cursor-pointer bg-gray-50/50"
                    >
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="font-bold text-xs text-gray-800">Tải ảnh trang phục riêng</p>
                      <p className="text-[10px] text-gray-400 mt-1">Ảnh quần áo trải phẳng hoặc chụp trên mannequin</p>
                    </div>
                  )}
                </div>
              )}

              {/* Category Selector */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-gray-700 mb-2">Loại trang phục:</label>
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
                  {[
                    { id: 'upper_body', label: 'Áo (Upper)' },
                    { id: 'lower_body', label: 'Quần/Váy (Lower)' },
                    { id: 'dresses', label: 'Đầm liền (Dresses)' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`py-2 px-1 rounded-xl transition ${
                        category === cat.id
                          ? 'bg-black text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* CARD 3: TÙY CHỌN NÂNG CAO (COLLAPSIBLE) */}
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between text-xs font-bold text-gray-700 cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <SlidersHorizontal size={14} className="text-purple-600" />
                  Cấu hình AI nâng cao
                </span>
                <ChevronRight
                  size={16}
                  className={`transition-transform duration-200 ${showAdvanced ? 'rotate-90' : ''}`}
                />
              </button>

              {showAdvanced && (
                <div className="pt-4 space-y-4 border-t border-gray-100 mt-3 text-xs">
                  <div>
                    <div className="flex justify-between font-bold mb-1">
                      <span>Denoising Steps:</span>
                      <span className="font-mono text-purple-600">{denoiseSteps}</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="40"
                      value={denoiseSteps}
                      onChange={(e) => setDenoiseSteps(Number(e.target.value))}
                      className="w-full accent-purple-600"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Bước khử nhiễu (20-40). Số lớn hơn nét hơn nhưng lâu hơn.</p>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoCrop}
                      onChange={(e) => setAutoCrop(e.target.checked)}
                      className="w-4 h-4 accent-purple-600 rounded-sm"
                    />
                    <span className="font-medium text-gray-700">Tự động căn chỉnh & cắt khung (Auto Crop)</span>
                  </label>
                </div>
              )}
            </div>

            {/* NÚT KÍCH HOẠT BẮT ĐẦU THỬ ĐỒ (CTA BUTTON) */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleStartTryOn}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-black text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-purple-200 hover:opacity-95 active:scale-[0.99] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>AI Đang Xử Lý...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Bắt Đầu Thử Đồ Bằng AI</span>
                </>
              )}
            </button>
          </div>

          {/* CỘT GIỮA (5 CỘT): KHUNG CANVAS LIVE PREVIEW / HIỆU ỨNG PROCESSING / KẾT QUẢ */}
          <div className="lg:col-span-5 space-y-6">
            {isProcessing ? (
              /* Hiệu ứng AI Scanning & Tiến trình động */
              <TryOnProcessingState
                personImage={getActivePersonImage()}
                garmentImage={getActiveGarmentImage()}
                aspectRatio="aspect-[3/4]"
                onCancel={() => {
                  setIsProcessing(false)
                  if (pollingRef.current) clearInterval(pollingRef.current)
                }}
              />
            ) : resultData?.resultImage ? (
              /* Khung hiển thị kết quả Before / After */
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-5">
                <BeforeAfterSlider
                  beforeImage={resultData.personImage}
                  afterImage={resultData.resultImage}
                  aspectRatio="aspect-[3/4]"
                />

                {/* Các nút hành động sau khi thử đồ */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleDownloadImage}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-gray-200 text-gray-800 font-bold text-xs hover:bg-gray-50 transition cursor-pointer"
                  >
                    <Download size={14} />
                    <span>Tải ảnh HD</span>
                  </button>

                  {selectedProduct ? (
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-black text-white font-bold text-xs uppercase tracking-wider hover:bg-gray-800 transition cursor-pointer shadow-md shadow-gray-200"
                    >
                      <ShoppingBag size={14} />
                      <span>Thêm vào giỏ</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsPickerOpen(true)}
                      className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-purple-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-purple-700 transition cursor-pointer"
                    >
                      <Shirt size={14} />
                      <span>Thử đồ khác</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Khung chuẩn bị (Idle State Canvas) */
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm text-center">
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 mb-6 flex items-center justify-center border border-gray-200">
                  {getActivePersonImage() ? (
                    <img
                      src={getActivePersonImage()}
                      alt="Selected Person"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400 p-6">
                      <User className="w-16 h-16 mx-auto mb-3 stroke-1 text-gray-300" />
                      <p className="font-semibold text-xs text-gray-500">Chưa chọn ảnh người mẫu</p>
                    </div>
                  )}

                  {/* Garment Floating Preview Pin */}
                  {getActiveGarmentImage() && (
                    <div className="absolute top-4 right-4 z-10 w-20 h-24 rounded-xl overflow-hidden bg-white shadow-xl border-2 border-white">
                      <img
                        src={getActiveGarmentImage()}
                        alt="Garment Overlay"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-0 inset-x-0 bg-black/75 text-white text-[8px] font-bold py-0.5 uppercase">
                        Trang phục
                      </span>
                    </div>
                  )}
                </div>

                <h3 className="text-base font-black uppercase text-gray-900">Sẵn sàng thử đồ AI</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
                  Nhấn nút &ldquo;Bắt Đầu Thử Đồ Bằng AI&rdquo; ở cột bên trái để hệ thống tiến hành ướm trang phục trực tiếp lên cơ thể của bạn.
                </p>
              </div>
            )}
          </div>

          {/* CỘT PHẢI (3 CỘT): LỊCH SỬ THỬ ĐỒ (HISTORY DRAWER) */}
          <div className="lg:col-span-3">
            <TryOnHistoryDrawer
              isAuthenticated={isAuthenticated}
              refreshTrigger={refreshHistoryTrigger}
              onSelectHistoryItem={handleSelectHistoryItem}
            />
          </div>

        </div>
      </main>
    </div>
  )
}
