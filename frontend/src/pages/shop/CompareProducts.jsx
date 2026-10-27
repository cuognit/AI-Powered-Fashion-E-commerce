import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ComparisonTable from '../../components/comparison/ComparisonTable.jsx'
import { getComparisonProduct } from '../../services/comparisonApi.js'
import useComparisonStore from '../../store/comparisonStore.js'
import { normalizeComparisonProduct } from '../../utils/comparisonUtils.js'

function requestErrorMessage(error) {
  if (error.code === 'COMPARISON_TIMEOUT') return error.message
  if (error.response?.status === 404) return 'Sản phẩm không tồn tại hoặc không còn khả dụng.'
  if (typeof error.response?.data?.message === 'string') return error.response.data.message
  if (!error.response && error.request) return 'Không kết nối được Product API. Kiểm tra backend và kết nối mạng.'
  return error.message || 'Không thể tải sản phẩm.'
}

export default function CompareProducts() {
  const selectedIds = useComparisonStore((state) => state.selectedIds)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState([])
  const [retryCount, setRetryCount] = useState(0)
  const [loadedIds, setLoadedIds] = useState(null)

  useEffect(() => {
    let active = true
    const controller = new AbortController()

    async function loadProducts() {
      setLoading(true)
      setProducts([])
      setErrors([])

      if (!selectedIds.length) {
        setLoadedIds(selectedIds)
        setLoading(false)
        return
      }

      const results = await Promise.allSettled(selectedIds.map(async (id) => {
        const response = await getComparisonProduct(id, { signal: controller.signal })
        const payload = response?.data
        const product = payload?.data

        if (payload?.success !== true || !product || Array.isArray(product)
          || typeof product._id !== 'string' || product._id.toLowerCase() !== id.toLowerCase()) {
          throw new Error('Response API không đúng cấu trúc { success: true, data: product } hoặc không khớp ID yêu cầu.')
        }

        return product
      }))

      if (!active) return

      const loadedProducts = []
      const requestErrors = []
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') loadedProducts.push(result.value)
        else requestErrors.push({ id: selectedIds[index], message: requestErrorMessage(result.reason) })
      })
      setProducts(loadedProducts)
      setErrors(requestErrors)
      setLoadedIds(selectedIds)
      setLoading(false)
    }

    loadProducts()
    return () => {
      active = false
      controller.abort()
    }
  }, [selectedIds, retryCount])

  const isCurrentSelection = loadedIds === selectedIds
  const isLoading = selectedIds.length > 0 && (loading || !isCurrentSelection)
  const comparisonProducts = isCurrentSelection ? products.map(normalizeComparisonProduct) : []

  return (
    <section className='min-h-[70vh] bg-[#faf9f7] text-neutral-950'>
      <div className='mx-auto max-w-[1360px] px-4 py-12 sm:px-6 lg:px-8 lg:py-20'>
        <header className='border-b border-black pb-8 sm:pb-10'>
          <p className='text-[10px] font-bold uppercase tracking-[0.28em] text-neutral-500'>AESTHETIX / Product comparison</p>
          <div className='mt-4 flex flex-col justify-between gap-5 sm:flex-row sm:items-end'>
            <div>
              <h1 className='text-3xl font-black uppercase tracking-tight sm:text-5xl'>So sánh sản phẩm</h1>
              <p className='mt-4 max-w-xl text-sm leading-6 text-neutral-600'>Đặt các thiết kế cạnh nhau để đối chiếu chất liệu, kiểu dáng và lựa chọn phù hợp với bạn.</p>
            </div>
            <span className='w-fit shrink-0 border border-neutral-300 bg-white px-4 py-2 font-mono text-xs uppercase'>{isLoading ? 'Đang tải sản phẩm' : `${comparisonProducts.length} / ${selectedIds.length} sản phẩm đã tải`}</span>
          </div>
        </header>

        <div className='mt-8 sm:mt-10' aria-busy={isLoading}>
          {!selectedIds.length && (
            <div className='border border-neutral-300 bg-white px-5 py-12 text-center'>
              <h2 className='text-xl font-bold uppercase'>Chưa chọn sản phẩm so sánh</h2>
              <p className='mt-3 text-sm leading-6 text-neutral-600'>Mở bộ sưu tập hoặc trang chi tiết, nhấn So sánh để chọn từ 2 đến 3 sản phẩm.</p>
              <Link to='/collections' className='mt-5 inline-block bg-black px-5 py-3 text-xs font-bold uppercase text-white'>Khám phá bộ sưu tập</Link>
            </div>
          )}

          {selectedIds.length === 1 && <p className='mb-4 text-sm leading-6 text-neutral-600'>Bạn mới chọn 1 sản phẩm. <Link to='/collections' className='font-semibold underline underline-offset-4'>Chọn thêm ít nhất 1 sản phẩm</Link> để đối chiếu.</p>}

          {isLoading && <p role='status' className='border border-neutral-300 bg-white px-5 py-12 text-center text-sm text-neutral-600'>Đang lấy thông tin sản phẩm từ cửa hàng...</p>}

          {selectedIds.length > 0 && !isLoading && errors.length > 0 && (
            <div role='alert' className='mb-6 border border-amber-300 bg-amber-50 p-5 text-sm text-amber-950'>
              <p className='font-bold'>{comparisonProducts.length ? 'Một số sản phẩm chưa tải được. Bảng vẫn hiển thị các sản phẩm tải thành công.' : 'Chưa thể hiển thị sản phẩm so sánh.'}</p>
              <ul className='mt-3 space-y-2'>
                {errors.map((error) => <li key={error.id} className='break-words leading-6'><span className='font-mono'>ID {error.id}: </span>{error.message}</li>)}
              </ul>
              <button type='button' onClick={() => setRetryCount((count) => count + 1)} className='mt-4 bg-black px-5 py-3 text-xs font-bold uppercase text-white'>Thử tải lại</button>
            </div>
          )}

          {selectedIds.length > 0 && !isLoading && comparisonProducts.length > 0 && (
            <>
              {selectedIds.length >= 2 && comparisonProducts.length < 2 && <p className='mb-3 text-sm text-neutral-600'>Cần tải thành công ít nhất hai sản phẩm để đối chiếu đầy đủ.</p>}
              <p id='comparison-scroll-hint' className='mb-3 text-xs leading-5 text-neutral-500'>Trên màn hình nhỏ, cuộn ngang trong bảng để xem đầy đủ các sản phẩm. Cột tiêu chí luôn được giữ bên trái.</p>
              <ComparisonTable products={comparisonProducts} />
            </>
          )}
        </div>

        <p className='mt-5 text-xs leading-5 text-neutral-500'>Thông tin được lấy từ Product API khi tải trang. Thuộc tính chưa có trong dữ liệu sẽ hiển thị “Chưa cung cấp”.</p>
      </div>
    </section>
  )
}
