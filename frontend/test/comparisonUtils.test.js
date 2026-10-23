import assert from 'node:assert/strict'
import test from 'node:test'
import { formatComparisonPrice, formatComparisonRating, getComparisonRows, normalizeComparisonProduct } from '../src/utils/comparisonUtils.js'
import { formatCurrency } from '../src/utils/formatCurrency.js'

const option = (slug, label, value) => ({ attribute_slug: slug, attribute_name: label, value_name: value })

test('một mức giá, giá 0 và fallback sale_price/base_price được định dạng đúng', () => {
  for (const product of [{ min_price: 100000, max_price: 100000 }, { base_price: 100000 }, { sale_price: 100000, base_price: 200000 }]) {
    assert.equal(formatComparisonPrice(normalizeComparisonProduct(product)), formatCurrency(100000))
  }
  assert.equal(formatComparisonPrice(normalizeComparisonProduct({ sale_price: 0, base_price: 100000 })), formatCurrency(0))
})

test('khoảng giá API có ưu tiên hơn giá cấp sản phẩm và giá từng biến thể', () => {
  const normalized = normalizeComparisonProduct({ min_price: 680000, max_price: 840000, sale_price: 695200, base_price: 790000, variants: [{ sale_price: 1 }] })
  assert.equal(normalized.minPrice, 680000)
  assert.equal(normalized.maxPrice, 840000)
  assert.equal(formatComparisonPrice(normalized), `${formatCurrency(680000)} – ${formatCurrency(840000)}`)
})

test('thiếu giá, giá âm, NaN, Infinity, chuỗi số và khoảng giá đảo đều không tạo giá giả', () => {
  const invalid = [{}, { base_price: -1 }, { base_price: NaN }, { base_price: Infinity }, { base_price: '100000' }, { sale_price: '', base_price: 100000 }, { min_price: 200, max_price: 100 }, { min_price: 100, max_price: '200' }, { max_price: 100 }]
  for (const product of invalid) assert.equal(formatComparisonPrice(normalizeComparisonProduct(product)), 'Chưa cung cấp')
})

test('ưu tiên option_values cho từng biến thể, loại trùng màu/size và giữ thứ tự đầu tiên', () => {
  const product = normalizeComparisonProduct({ variants: [
    { color: 'Giá trị cũ', size: 'Cũ', option_values: [option('mau-sac', 'Màu sắc', ' Trắng '), option('kich-thuoc', 'Kích thước', 'M')] },
    { option_values: [option('mau-sac', 'Màu sắc', 'trắng'), option('kich-thuoc', 'Kích thước', 'L')] },
    { color: 'Đen', size: 'M' },
  ] })
  assert.deepEqual(product.colors, ['Trắng', 'Đen'])
  assert.deepEqual(product.sizes, ['M', 'L'])
  assert.deepEqual(product.attributes, [])
})

test('SKU được tổng hợp từ nhiều biến thể, bỏ giá trị rỗng và trùng', () => {
  const product = normalizeComparisonProduct({ variants: [{ sku: ' A-M ' }, { sku: 'A-L' }, { sku: 'A-M' }, { sku: null }] })
  assert.deepEqual(product.skus, ['A-M', 'A-L'])
})

test('thuộc tính động bất kỳ được gom theo khóa với tên hiển thị từ API', () => {
  const product = normalizeComparisonProduct({ variants: [
    { option_values: [option('chat-lieu', 'Chất liệu', 'Cotton'), option('ket-cau-det', 'Kết cấu dệt', 'Dệt chéo')] },
    { option_values: [option('chat-lieu', 'Chất liệu', 'cotton'), option('ket-cau-det', 'Kết cấu dệt', 'Dệt trơn')] },
  ] })
  assert.deepEqual(product.attributes, [
    { key: 'attribute:chat-lieu', label: 'Chất liệu', values: ['Cotton'] },
    { key: 'attribute:ket-cau-det', label: 'Kết cấu dệt', values: ['Dệt chéo', 'Dệt trơn'] },
  ])
})

test('thuộc tính thiếu slug dùng attribute_id; dữ liệu option không đầy đủ được bỏ qua', () => {
  const product = normalizeComparisonProduct({ variants: [{ option_values: [null, 1, {}, { attribute_id: 'attr-1', attribute_name: 'Độ dày', value_name: 'Mỏng' }] }] })
  assert.deepEqual(product.attributes, [{ key: 'attribute:attr-1', label: 'Độ dày', values: ['Mỏng'] }])
})

test('không có variants hoặc variants sai kiểu vẫn trả cấu trúc hiển thị an toàn', () => {
  for (const input of [null, undefined, [], {}, { variants: null }, { variants: {} }, { variants: [null, 12, {}] }]) {
    const product = normalizeComparisonProduct(input)
    assert.deepEqual(product.colors, [])
    assert.deepEqual(product.sizes, [])
    assert.deepEqual(product.attributes, [])
    assert.deepEqual(product.skus, [])
    assert.equal(product.description, null)
  }
})

test('không suy ra chất liệu hay phom dáng từ tên và mô tả', () => {
  const product = normalizeComparisonProduct({ name: 'Cotton Oversize', description: 'Lụa, linen và phom rộng' })
  assert.deepEqual(product.attributes, [])
  assert.equal(getComparisonRows([product]).some((row) => row.key.startsWith('attribute:')), false)
})

test('hàng động là hợp các thuộc tính có thật của tối đa ba sản phẩm, không lặp hàng', () => {
  const a = normalizeComparisonProduct({ variants: [{ option_values: [option('chat-lieu', 'Chất liệu', 'Cotton')] }] })
  const b = normalizeComparisonProduct({ variants: [{ option_values: [option('chat-lieu', 'Chất liệu', 'Linen'), option('form', 'Phom', 'Rộng')] }] })
  const c = normalizeComparisonProduct({})
  const rows = getComparisonRows([a, b, c])
  assert.equal(rows.filter((row) => row.key === 'attribute:chat-lieu').length, 1)
  assert.ok(rows.some((row) => row.key === 'attribute:form' && row.label === 'Phom'))
  assert.equal(c.attributes.find((attribute) => attribute.key === 'attribute:form'), undefined)
})

test('thương hiệu đã populate được ưu tiên; ảnh fallback từ image_assets khi images trống', () => {
  const product = normalizeComparisonProduct({ brand: 'Cũ', brand_id: { name: 'Thương hiệu hiện tại' }, images: ['', null], image_assets: [{ url: 'https://example.test/product.jpg' }] })
  assert.equal(product.brand, 'Thương hiệu hiện tại')
  assert.equal(product.image, 'https://example.test/product.jpg')
  assert.equal(normalizeComparisonProduct({ images: ['https://example.test/gallery.jpg'], image_assets: [{ url: 'other' }] }).image, 'https://example.test/gallery.jpg')
  assert.equal(normalizeComparisonProduct({}).image, null)
})

test('đánh giá hợp lệ dùng average_rating/reviews_count; không có đánh giá không hiện 0 sao', () => {
  assert.equal(formatComparisonRating(normalizeComparisonProduct({ average_rating: 4.5, reviews_count: 12 })), '4.5 / 5 (12 đánh giá)')
  assert.equal(formatComparisonRating(normalizeComparisonProduct({ average_rating: 5, reviews_count: 0 })), 'Chưa có đánh giá')
  assert.equal(formatComparisonRating(normalizeComparisonProduct({})), 'Chưa cung cấp')
})

test('điểm sai và thiếu số đánh giá không được diễn giải thành điểm hợp lệ', () => {
  for (const average of [-1, 0, 6, NaN, '5']) {
    assert.equal(formatComparisonRating(normalizeComparisonProduct({ average_rating: average, reviews_count: 2 })), '2 đánh giá · Chưa cung cấp điểm')
  }
  assert.equal(formatComparisonRating(normalizeComparisonProduct({ average_rating: 5 })), 'Chưa cung cấp')
  assert.equal(formatComparisonRating(normalizeComparisonProduct({ reviewSummary: { average: 4, count: 3 } })), '4.0 / 5 (3 đánh giá)')
})

test('mô tả dài và ngắt dòng được giữ đầy đủ, không bị cắt', () => {
  const description = 'Mô tả sản phẩm.\n'.repeat(500)
  assert.equal(normalizeComparisonProduct({ description }).description, description.trim())
})

test('pure function: không sửa đầu vào frozen và đầu ra không dùng chung mảng thuộc tính', () => {
  const input = { _id: 'p1', name: ' Áo ', images: ['https://example.test/a.jpg'], variants: [{ sku: 'A', option_values: [option('chat-lieu', 'Chất liệu', 'Cotton')] }] }
  const before = structuredClone(input)
  function freeze(value) {
    if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value) }
    return value
  }
  freeze(input)
  const first = normalizeComparisonProduct(input)
  assert.deepEqual(first, normalizeComparisonProduct(input))
  first.attributes[0].values.push('Chỉ sửa đầu ra')
  first.skus.push('B')
  assert.deepEqual(input, before)
  assert.deepEqual(normalizeComparisonProduct(input).attributes[0].values, ['Cotton'])
})
