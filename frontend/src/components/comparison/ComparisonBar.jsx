import { GitCompareArrows, Trash2, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useComparisonStore, { MAX_COMPARISON_PRODUCTS } from '../../store/comparisonStore.js'

export default function ComparisonBar() {
  const selectedIds = useComparisonStore((state) => state.selectedIds)
  const removeProduct = useComparisonStore((state) => state.removeProduct)
  const clearComparison = useComparisonStore((state) => state.clearComparison)
  const navigate = useNavigate()
  const count = selectedIds.length
  const canCompare = count >= 2

  if (!count) return null

  // Nằm trong luồng layout để không che chatbot hoặc nội dung trên mobile.
  return (
    <section aria-label='Danh sách sản phẩm đã chọn so sánh' className='border-b border-neutral-300 bg-[#f7f6f3]'>
      <div className='mx-auto max-w-[1360px] space-y-3 px-4 py-4 sm:px-6 lg:px-8'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <p className='flex items-center gap-2 text-xs font-bold uppercase tracking-wide' aria-live='polite'>
            <GitCompareArrows className='h-4 w-4 shrink-0' aria-hidden='true' />
            Đã chọn {count}/{MAX_COMPARISON_PRODUCTS} sản phẩm
          </p>
          <button type='button' onClick={() => clearComparison()} className='inline-flex min-h-11 items-center gap-2 px-2 text-xs font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black'>
            <Trash2 className='h-4 w-4' aria-hidden='true' />Xóa tất cả
          </button>
        </div>

        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <ul className='flex min-w-0 flex-wrap gap-2' aria-label='Các lựa chọn hiện tại'>
            {selectedIds.map((id, index) => (
              <li key={id} className='flex items-center gap-2 border border-neutral-300 bg-white pl-3'>
                <span className='text-xs'>Sản phẩm {index + 1}<span className='ml-2 font-mono text-[10px] text-neutral-500' title={id}>…{id.slice(-6)}</span></span>
                <button type='button' onClick={() => removeProduct(id)} aria-label={`Bỏ sản phẩm ${index + 1}, ID ${id}, khỏi so sánh`} className='grid h-11 w-11 shrink-0 place-items-center text-neutral-500 transition hover:bg-black hover:text-white focus-visible:outline-2 focus-visible:outline-black'>
                  <X className='h-4 w-4' aria-hidden='true' />
                </button>
              </li>
            ))}
          </ul>
          <button type='button' disabled={!canCompare} aria-describedby='comparison-bar-hint' onClick={() => { if (canCompare) navigate('/compare') }} className='inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 bg-black px-5 py-3 text-xs font-bold uppercase text-white transition hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto'>
            <GitCompareArrows className='h-4 w-4' aria-hidden='true' />So sánh
          </button>
        </div>
        <p id='comparison-bar-hint' className='text-xs leading-5 text-neutral-500'>{canCompare ? 'Mở bảng để xem thông tin các sản phẩm đã chọn.' : 'Chọn thêm ít nhất 1 sản phẩm để mở bảng so sánh.'}</p>
      </div>
    </section>
  )
}
