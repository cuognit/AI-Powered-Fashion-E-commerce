import Product from '../models/product.model.js'
import { getTextEmbedding } from '../services/ai.service.js'
import { buildCatalogFilter, CatalogQueryError, escapeRegex, metaFor, parseCatalogQuery } from '../utils/catalogQuery.js'

const suggestions = ['Áo chống nắng UPF 50+', 'Đồ bơi đi biển', 'Áo sơ mi lụa công sở', 'Set đồ tập gym yoga', 'Đầm dạ tiệc cao cấp', 'Áo thun streetwear unisex']
const normalized = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

function cosine(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || !a.length || a.length !== b.length) return 0
  let dot = 0; let aa = 0; let bb = 0
  for (let index = 0; index < a.length; index += 1) { dot += a[index] * b[index]; aa += a[index] ** 2; bb += b[index] ** 2 }
  return aa && bb ? dot / Math.sqrt(aa * bb) : 0
}

function lexicalScore(product, query) {
  const phrase = normalized(query)
  const text = normalized(`${product.name} ${product.brand} ${product.category_id?.name || ''} ${product.description}`)
  if (!phrase) return 0
  let score = text.includes(phrase) ? 1 : 0
  const words = phrase.split(/\s+/).filter((word) => word.length > 1)
  if (words.length) score += words.filter((word) => text.includes(word)).length / words.length
  return score / 2
}

function sortResults(items, sort) {
  const price = (item) => item.min_price ?? item.sale_price ?? item.base_price ?? 0
  if (sort === 'newest') return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  if (sort === 'price_asc') return items.sort((a, b) => price(a) - price(b))
  if (sort === 'price_desc') return items.sort((a, b) => price(b) - price(a))
  if (sort === 'name') return items.sort((a, b) => a.name.localeCompare(b.name, 'vi'))
  return items.sort((a, b) => b.score - a.score)
}

function withPriceRange(product) {
  const prices = (product.variants || []).filter((variant) => variant.stock > 0).map((variant) => variant.sale_price ?? variant.base_price ?? product.sale_price ?? product.base_price)
  return { ...product, min_price: prices.length ? Math.min(...prices) : product.sale_price ?? product.base_price, max_price: prices.length ? Math.max(...prices) : product.sale_price ?? product.base_price }
}

export async function searchCatalog(req, res) {
  try {
    const parsed = parseCatalogQuery(req.query)
    const query = String(req.query.q || req.query.query || '').trim()
    if (query.length > 200) throw new CatalogQueryError('Từ khóa tìm kiếm quá dài')
    const filter = await buildCatalogFilter(parsed)
    let queryVector = null
    if (query) queryVector = await getTextEmbedding(query)

    const hasVector = Array.isArray(queryVector) && queryVector.length > 0
    const vectorFilter = hasVector ? { ...filter, embedding_vector: { $exists: true, $ne: [] } } : null
    let products = hasVector ? await Product.find(vectorFilter).populate('category_id', 'name slug').lean() : []
    let searchMode = 'semantic'

    if (!hasVector || products.length === 0) {
      searchMode = 'keyword_fallback'
      const terms = query.split(/\s+/).filter(Boolean).slice(0, 12).map((term) => new RegExp(escapeRegex(term), 'i'))
      const keywordFilter = terms.length ? { ...filter, $or: terms.flatMap((term) => [{ name: term }, { brand: term }, { description: term }]) } : filter
      products = await Product.find(keywordFilter).populate('category_id', 'name slug').lean()
      products = products.map((product) => ({ ...product, score: lexicalScore(product, query) })).filter((product) => !query || product.score > 0)
    } else {
      products = products.map((product) => ({ ...product, score: Math.max(0, Math.min(1, cosine(queryVector, product.embedding_vector) * 0.8 + lexicalScore(product, query) * 0.2)) }))
      if (query) products = products.filter((product) => product.score >= 0.25)
    }

    products = products.map(withPriceRange)
    sortResults(products, parsed.sort)
    const total = products.length
    const data = products.slice(parsed.skip, parsed.skip + parsed.limit)
    res.json({ success: true, search_mode: query ? searchMode : null, data, meta: { ...metaFor(total, parsed), query, suggestions } })
  } catch (error) {
    res.status(error instanceof CatalogQueryError ? 400 : 500).json({ success: false, message: error.message })
  }
}
