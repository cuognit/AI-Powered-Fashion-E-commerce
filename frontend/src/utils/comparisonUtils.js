import { formatCurrency } from './formatCurrency.js'

const text = (value) => typeof value === 'string' ? value.trim() : ''
const array = (value) => Array.isArray(value) ? value : []
const validPrice = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0
const colorSlugs = new Set(['mau-sac', 'mau', 'color'])
const sizeSlugs = new Set(['kich-thuoc', 'size'])

function uniqueText(values) {
  const seen = new Set()
  return values.map(text).filter((value) => {
    const key = value.normalize('NFC').toLocaleLowerCase('vi')
    if (!value || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function priceRange(product) {
  if (product.min_price != null || product.max_price != null) {
    const min = product.min_price
    const max = product.max_price ?? min
    return validPrice(min) && validPrice(max) && max >= min
      ? { minPrice: min, maxPrice: max }
      : { minPrice: null, maxPrice: null }
  }
  const price = product.sale_price ?? product.base_price
  return validPrice(price) ? { minPrice: price, maxPrice: price } : { minPrice: null, maxPrice: null }
}

export function normalizeComparisonProduct(input) {
  const product = input && typeof input === 'object' && !Array.isArray(input) ? input : {}
  const variants = array(product.variants).filter((variant) => variant && typeof variant === 'object')
  const optionsOf = (variant) => array(variant.option_values).filter((option) => option && typeof option === 'object')
  const valuesFor = (variant, slugs, fallback) => {
    const values = uniqueText(optionsOf(variant).filter((option) => slugs.has(text(option.attribute_slug))).map((option) => option.value_name))
    return values.length ? values : [fallback]
  }
  const attributes = new Map()

  for (const option of variants.flatMap(optionsOf)) {
    const slug = text(option.attribute_slug)
    if (colorSlugs.has(slug) || sizeSlugs.has(slug)) continue
    const identity = slug || text(option.attribute_id)
    const label = text(option.attribute_name) || slug
    const value = text(option.value_name)
    if (!identity || !label || !value) continue
    const key = `attribute:${identity}`
    if (!attributes.has(key)) attributes.set(key, { key, label, values: [] })
    attributes.get(key).values.push(value)
  }

  const count = product.reviews_count ?? product.reviewSummary?.count
  const average = product.average_rating ?? product.rating ?? product.reviewSummary?.average
  const reviewCount = Number.isInteger(count) && count >= 0 ? count : null

  return {
    _id: text(product._id),
    name: text(product.name) || 'Chưa cung cấp tên sản phẩm',
    image: array(product.images).map(text).find(Boolean)
      || array(product.image_assets).map((asset) => text(asset?.url)).find(Boolean) || null,
    brand: text(product.brand_id?.name) || text(product.brand) || null,
    ...priceRange(product),
    colors: uniqueText(variants.flatMap((variant) => valuesFor(variant, colorSlugs, variant.color))),
    sizes: uniqueText(variants.flatMap((variant) => valuesFor(variant, sizeSlugs, variant.size))),
    attributes: [...attributes.values()].map((attribute) => ({ ...attribute, values: uniqueText(attribute.values) })),
    skus: [...new Set(variants.map((variant) => text(variant.sku)).filter(Boolean))],
    reviewCount,
    rating: reviewCount > 0 && typeof average === 'number' && Number.isFinite(average) && average >= 1 && average <= 5 ? average : null,
    description: text(product.description) || null,
  }
}

export function getComparisonRows(products) {
  const dynamicRows = new Map()
  for (const product of products) {
    for (const attribute of product.attributes) {
      if (!dynamicRows.has(attribute.key)) dynamicRows.set(attribute.key, { key: attribute.key, label: attribute.label })
    }
  }
  return [
    { key: 'brand', label: 'Thương hiệu' },
    { key: 'price', label: 'Giá bán' },
    { key: 'colors', label: 'Màu sắc' },
    { key: 'sizes', label: 'Kích cỡ' },
    ...dynamicRows.values(),
    { key: 'skus', label: 'Mã SKU' },
    { key: 'rating', label: 'Đánh giá' },
    { key: 'description', label: 'Mô tả' },
  ]
}

export function formatComparisonPrice(product) {
  if (!validPrice(product.minPrice)) return 'Chưa cung cấp'
  return product.maxPrice > product.minPrice
    ? `${formatCurrency(product.minPrice)} – ${formatCurrency(product.maxPrice)}`
    : formatCurrency(product.minPrice)
}

export function formatComparisonRating(product) {
  if (product.reviewCount === 0) return 'Chưa có đánh giá'
  if (product.reviewCount == null) return 'Chưa cung cấp'
  if (product.rating == null) return `${product.reviewCount} đánh giá · Chưa cung cấp điểm`
  return `${product.rating.toFixed(1)} / 5 (${product.reviewCount} đánh giá)`
}
