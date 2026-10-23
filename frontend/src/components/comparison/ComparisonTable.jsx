import { useState } from 'react'
import { formatComparisonPrice, formatComparisonRating, getComparisonRows } from '../../utils/comparisonUtils.js'

function ComparisonImage({ product }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className='mt-3 aspect-[3/4] overflow-hidden bg-neutral-200'>
      {product.image && !failed
        ? <img src={product.image} alt={product.name} loading='lazy' onError={() => setFailed(true)} className='h-full w-full object-cover' />
        : <span className='grid h-full place-items-center px-3 text-center text-xs font-normal text-neutral-500'>Chưa cung cấp ảnh</span>}
    </div>
  )
}

function ComparisonValue({ product, row }) {
  if (row.key === 'price') return formatComparisonPrice(product)
  if (row.key === 'rating') return formatComparisonRating(product)
  const value = row.key.startsWith('attribute:')
    ? product.attributes.find((attribute) => attribute.key === row.key)?.values
    : product[row.key]

  if (Array.isArray(value)) {
    return value.length ? <ul className='max-h-44 space-y-1 overflow-y-auto' aria-label={row.label}>{value.map((item) => <li key={item} className='break-words [overflow-wrap:anywhere]'>{item}</li>)}</ul> : 'Chưa cung cấp'
  }
  return value || 'Chưa cung cấp'
}

export default function ComparisonTable({ products }) {
  const rows = getComparisonRows(products)

  return (
    <div
      role='region'
      aria-label='Bảng so sánh sản phẩm'
      aria-describedby='comparison-scroll-hint'
      tabIndex={0}
      className='overflow-x-auto border border-neutral-300 bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black'
    >
      <table className={`w-full table-fixed border-separate border-spacing-0 text-left text-sm ${products.length === 3 ? 'min-w-[960px]' : 'min-w-[680px]'}`}>
        <caption className='sr-only'>So sánh thông tin của {products.length} sản phẩm theo từng tiêu chí. Màu sắc và kích cỡ tổng hợp từ các biến thể, không thể hiện mọi kết hợp đều còn hàng.</caption>
        <thead>
          <tr>
            <th scope='col' className='sticky left-0 z-20 w-36 border-b border-r border-neutral-300 bg-neutral-100 px-4 py-6 align-bottom text-xs font-bold uppercase tracking-wider sm:w-44 sm:px-6'>Tiêu chí</th>
            {/* Mỗi sản phẩm tạo một cột; _id là key ổn định của sản phẩm. */}
            {products.map((product, index) => (
              <th key={product._id} scope='col' className='border-b border-neutral-300 bg-[#f7f6f3] px-5 py-6 align-top sm:px-6'>
                <span className='text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500'>Sản phẩm {String(index + 1).padStart(2, '0')}</span>
                <ComparisonImage key={product.image || product._id} product={product} />
                <span className='mt-3 block break-words text-lg font-black uppercase leading-7 tracking-tight [overflow-wrap:anywhere]'>{product.name}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <th scope='row' className='sticky left-0 z-10 break-words border-b border-r border-neutral-200 bg-neutral-50 px-4 py-5 align-top text-xs font-bold uppercase tracking-wide [overflow-wrap:anywhere] sm:px-6'>{row.label}</th>
              {products.map((product) => (
                <td key={product._id} className={`break-words whitespace-pre-line border-b border-neutral-200 px-5 py-5 align-top leading-6 [overflow-wrap:anywhere] sm:px-6 ${row.key === 'price' ? 'font-mono text-base font-bold text-black' : 'text-neutral-600'}`}>
                  <ComparisonValue product={product} row={row} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
