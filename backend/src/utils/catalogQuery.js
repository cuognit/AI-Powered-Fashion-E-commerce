import mongoose from 'mongoose'
import Category from '../models/Category.js'
import Attribute from '../models/Attribute.js'

export const CATALOG_SORTS = new Set(['relevance', 'newest', 'price_asc', 'price_desc', 'name'])
export const ACTIVE_PRODUCT_FILTER = { is_deleted: false, business_enabled: { $ne: false }, status: 'available' }

export class CatalogQueryError extends Error {
  constructor(message) { super(message); this.statusCode = 400 }
}

export const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const csv = (value) => [...new Set(String(value || '').split(',').map((item) => item.trim()).filter(Boolean))].slice(0, 50)
const positiveInteger = (value, fallback, name, max = Number.MAX_SAFE_INTEGER) => {
  if (value == null || value === '') return fallback
  if (!/^\d+$/.test(String(value)) || Number(value) < 1 || Number(value) > max) throw new CatalogQueryError(`${name} không hợp lệ`)
  return Number(value)
}
const price = (value, name) => {
  if (value == null || value === '') return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) throw new CatalogQueryError(`${name} không hợp lệ`)
  return parsed
}

export function parseCatalogQuery(query = {}) {
  const page = positiveInteger(query.page, 1, 'page')
  const limit = positiveInteger(query.limit, 12, 'limit', 48)
  const sort = query.sort || 'relevance'
  if (!CATALOG_SORTS.has(sort)) throw new CatalogQueryError('sort không hợp lệ')
  const minPrice = price(query.minPrice, 'minPrice')
  const maxPrice = price(query.maxPrice, 'maxPrice')
  if (minPrice != null && maxPrice != null && minPrice > maxPrice) throw new CatalogQueryError('minPrice không được lớn hơn maxPrice')
  const attributes = Object.entries(query).filter(([key]) => key.startsWith('attr.')).map(([key, value]) => ({ slug: key.slice(5), values: csv(value) })).filter((item) => item.slug && item.values.length).slice(0, 4)
  return { page, limit, skip: (page - 1) * limit, sort, categories: csv(query.categories || query.category), brands: csv(query.brands || query.brand), size: String(query.size || '').trim(), color: String(query.color || '').trim(), attributes, minPrice, maxPrice }
}

export async function buildCatalogFilter(parsed) {
  const filter = { ...ACTIVE_PRODUCT_FILTER }
  if (parsed.categories.length) {
    const objectIds = parsed.categories.filter(mongoose.isValidObjectId).map((id) => new mongoose.Types.ObjectId(id))
    const labels = parsed.categories.filter((value) => !mongoose.isValidObjectId(value))
    if (labels.length) {
      const patterns = labels.map((value) => new RegExp(`^${escapeRegex(value)}$`, 'i'))
      const categories = await Category.find({ is_deleted: false, $or: [{ slug: { $in: patterns } }, { name: { $in: patterns } }] }).select('_id').lean()
      objectIds.push(...categories.map((category) => category._id))
    }
    filter.category_id = { $in: objectIds }
  }
  if (parsed.brands.length) {
    const objectIds = parsed.brands.filter(mongoose.isValidObjectId).map((id) => new mongoose.Types.ObjectId(id)); const labels = parsed.brands.filter((value) => !mongoose.isValidObjectId(value))
    if (objectIds.length && labels.length) filter.$or = [{ brand_id: { $in: objectIds } }, { brand: { $in: labels.map((value) => new RegExp(`^${escapeRegex(value)}$`, 'i')) } }]
    else if (objectIds.length) filter.brand_id = { $in: objectIds }
    else filter.brand = { $in: labels.map((value) => new RegExp(`^${escapeRegex(value)}$`, 'i')) }
  }
  if (parsed.attributes.length) {
    const docs = await Attribute.find({ slug: { $in: parsed.attributes.map((item) => item.slug) }, is_deleted: false }).lean(); const bySlug = new Map(docs.map((doc) => [doc.slug, doc])); const required = []
    for (const selected of parsed.attributes) { const doc = bySlug.get(selected.slug); if (!doc) { required.push({ $elemMatch: { value_id: null } }); continue } const ids = doc.values.filter((value) => !value.is_deleted && selected.values.includes(value.slug)).map((value) => value._id); required.push({ $elemMatch: { attribute_id: doc._id, value_id: { $in: ids } } }) }
    filter.variants = { $elemMatch: { stock: { $gt: 0 }, option_values: { $all: required } } }
  } else if (parsed.size || parsed.color) {
    const variant = { stock: { $gt: 0 } }
    if (parsed.size) variant.size = new RegExp(`^${escapeRegex(parsed.size)}$`, 'i')
    if (parsed.color) variant.color = new RegExp(`^${escapeRegex(parsed.color)}$`, 'i')
    filter.variants = { $elemMatch: variant }
  }
  if (parsed.minPrice != null || parsed.maxPrice != null) {
    const priceOf = { $ifNull: ['$$variant.sale_price', { $ifNull: ['$$variant.base_price', { $ifNull: ['$sale_price', '$base_price'] }] }] }
    const conditions = [{ $gt: ['$$variant.stock', 0] }]
    if (parsed.minPrice != null) conditions.push({ $gte: [priceOf, parsed.minPrice] })
    if (parsed.maxPrice != null) conditions.push({ $lte: [priceOf, parsed.maxPrice] })
    filter.$expr = { $and: [{ $anyElementTrue: { $map: { input: '$variants', as: 'variant', in: { $and: conditions } } } }] }
  }
  return filter
}

export function mongoSort(sort, relevanceFallback = { createdAt: -1, _id: -1 }) {
  if (sort === 'newest') return { createdAt: -1, _id: -1 }
  if (sort === 'price_asc') return { sale_price: 1, base_price: 1, _id: 1 }
  if (sort === 'price_desc') return { sale_price: -1, base_price: -1, _id: -1 }
  if (sort === 'name') return { name: 1, _id: 1 }
  return relevanceFallback
}

export const metaFor = (total, parsed) => ({ total_items: total, current_page: parsed.page, total_pages: Math.ceil(total / parsed.limit), limit: parsed.limit })
