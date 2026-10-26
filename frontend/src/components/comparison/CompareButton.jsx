import { Check, GitCompareArrows } from 'lucide-react'
import toast from 'react-hot-toast'
import useComparisonStore, { MAX_COMPARISON_PRODUCTS } from '../../store/comparisonStore.js'

export default function CompareButton({ productId, className = '' }) {
  const id = typeof productId === 'string' ? productId.trim().toLowerCase() : ''
  const isSelected = useComparisonStore((state) => state.selectedIds.includes(id))
  const addProduct = useComparisonStore((state) => state.addProduct)
  const removeProduct = useComparisonStore((state) => state.removeProduct)

  const onClick = (event) => {
    event.stopPropagation()
    const result = isSelected ? removeProduct(id) : addProduct(id)

    if (!result.success) {
      const messages = {
        invalid_id: 'ID sản phẩm không hợp lệ, chưa thể thêm vào so sánh.',
        duplicate: 'Sản phẩm đã có trong danh sách so sánh.',
        limit_reached: `Bạn chỉ có thể so sánh tối đa ${MAX_COMPARISON_PRODUCTS} sản phẩm. Hãy bỏ một sản phẩm trước khi thêm.`,
      }
      toast.error(messages[result.reason] || 'Không thể cập nhật danh sách so sánh.')
      return
    }

    toast.success(isSelected ? 'Đã bỏ sản phẩm khỏi danh sách so sánh' : 'Đã thêm sản phẩm vào danh sách so sánh')
  }

  return (
    <button
      type='button'
      onClick={onClick}
      disabled={!id}
      aria-label={isSelected ? 'Bỏ sản phẩm khỏi danh sách so sánh' : 'Thêm sản phẩm vào danh sách so sánh'}
      aria-pressed={isSelected}
      className={`inline-flex min-h-11 items-center justify-center gap-2 border px-3 py-2 text-[10px] font-bold uppercase tracking-wide transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-not-allowed disabled:opacity-50 sm:text-xs ${isSelected ? 'border-black bg-black text-white hover:bg-neutral-800' : 'border-neutral-300 bg-white text-black hover:border-black hover:bg-neutral-100'} ${className}`}
    >
      {isSelected ? <Check className='h-4 w-4 shrink-0' aria-hidden='true' /> : <GitCompareArrows className='h-4 w-4 shrink-0' aria-hidden='true' />}
      <span>{isSelected ? 'Đã chọn so sánh' : 'So sánh'}</span>
    </button>
  )
}
