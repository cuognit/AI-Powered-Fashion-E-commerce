import Product from '../models/product.model.js'
import Review from '../models/review.model.js'
import env from '../config/env.js'
import { embedSearchQuery } from './geminiEmbedding.service.js'


function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFC')
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function calculateCosineSimilarity(vecA, vecB) {
  if (!Array.isArray(vecA) || !Array.isArray(vecB) || !vecA.length || vecA.length !== vecB.length) {
    return 0
  }
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < vecA.length; i += 1) {
    dot += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }
  return normA && normB ? dot / (Math.sqrt(normA) * Math.sqrt(normB)) : 0
}

export function calculateLexicalScore(product, rawQuery) {
  const normQuery = normalizeText(rawQuery)
  if (!normQuery) return 0

  const prodName = normalizeText(product.name)
  const prodBrand = normalizeText(product.brand_id?.name || product.brand)
  const prodCategory = normalizeText(product.category_id?.name || product.category)
  const prodDesc = normalizeText(product.description)
  const fullText = `${prodName} ${prodBrand} ${prodCategory} ${prodDesc}`

  let score = 0
  if (prodName.includes(normQuery)) {
    score += 0.5
  } else if (fullText.includes(normQuery)) {
    score += 0.3
  }

  const queryWords = normQuery.split(/\s+/).filter((w) => w.length >= 2)
  if (queryWords.length > 0) {
    const matchedCount = queryWords.filter((w) => fullText.includes(w)).length
    score += (matchedCount / queryWords.length) * 0.5
  }

  return Math.min(1, score)
}

export function sanitizeProductForChat(product, score = 0) {
  const brand = product.brand_id?.name || product.brand || ''
  const category = product.category_id?.name || product.category || ''
  const images = (product.images || []).filter(Boolean)
  const primaryImage = images[0] || product.image_assets?.[0]?.url || ''

  const variants = (product.variants || []).map((v) => ({
    sku: v.sku,
    color: v.color,
    size: v.size,
    stock: v.stock,
    price: v.sale_price ?? v.base_price ?? product.sale_price ?? product.base_price,
  }))

  const effectivePrices = variants.filter((v) => v.stock > 0).map((v) => v.price)
  const minPrice = effectivePrices.length ? Math.min(...effectivePrices) : product.sale_price ?? product.base_price
  const maxPrice = effectivePrices.length ? Math.max(...effectivePrices) : product.sale_price ?? product.base_price

  return {
    id: String(product._id),
    name: product.name,
    brand,
    category,
    description: product.description || '',
    basePrice: product.base_price,
    salePrice: product.sale_price,
    minPrice,
    maxPrice,
    totalStock: product.total_stock,
    availability: product.status === 'available' && (product.total_stock > 0 || variants.some((v) => v.stock > 0)) ? 'Còn hàng' : 'Hết hàng',
    variants,
    image: primaryImage,
    images: images.slice(0, 3),
    productUrl: `/products/${product._id}`,
    score: Number(score.toFixed(3)),
  }
}

const GREETING_OR_GENERAL_PATTERNS = [
  /^(xin chào|chào bạn|chào|hello|hi|hey|alo|alo shop|ad ơi|shop ơi|chào shop|good morning|good evening)$/i,
  /^(cảm ơn|cảm ơn bạn|cảm ơn shop|thank you|thanks|thank|ok|oke|okie|dạ vâng|vâng ạ|tuyệt vời|tạm biệt|bye|bye bye)$/i,
  /^(bạn là ai|bạn tên gì|bạn làm được gì|hướng dẫn sử dụng|trợ lý là ai|bot là ai)$/i,
  /(địa chỉ|ở đâu|cửa hàng ở đâu|hotline|số điện thoại|chính sách đổi trả|phí ship|phí vận chuyển|giao hàng bao lâu|bảo hành|giờ mở cửa)/i,
]

const FASHION_PRODUCT_KEYWORDS = [
  'áo', 'quần', 'váy', 'đầm', 'giày', 'dép', 'túi', 'ba lô', 'balo', 'mũ', 'nón', 'thắt lưng',
  'sơ mi', 'polo', 't-shirt', 'hoodie', 'blazer', 'khoác', 'jacket', 'cardigan', 'chống nắng', 'len', 'nỉ',
  'jean', 'jeans', 'kaki', 'short', 'shorts', 'jogger', 'legging', 'tây', 'âu', 'suông', 'ống rộng',
  'sneaker', 'sandal', 'boot', 'boots', 'cao gót', 'chạy bộ', 'thể thao',
  'tìm', 'mua', 'tư vấn', 'gợi ý', 'xem mẫu', 'mẫu mới', 'sản phẩm', 'phối đồ', 'outfit', 'set đồ',
  'cotton', 'lụa', 'linen', 'satin', 'da', 'thun',
  'nike', 'adidas', 'zara', 'uniqlo', 'puma', 'h&m', 'levi', 'new balance',
]

/**
 * Kiểm tra xem câu truy vấn có mang ý định tìm kiếm / tư vấn sản phẩm thời trang hay không.
 */
export function isProductQuery(query = '') {
  const norm = normalizeText(query)
  if (!norm) return false

  for (const pattern of GREETING_OR_GENERAL_PATTERNS) {
    if (pattern.test(norm)) {
      return false
    }
  }

  const words = norm.split(/\s+/)
  return FASHION_PRODUCT_KEYWORDS.some((kw) => {
    if (kw.includes(' ')) {
      return norm.includes(kw)
    }
    return words.includes(kw)
  })
}

/**
 * Truy vấn sản phẩm thông minh cho Chatbot RAG (Chỉ gọi khi người dùng thực sự có nhu cầu tìm sản phẩm)
 * @param {string} query - Câu hỏi / nhu cầu tìm kiếm của người dùng
 * @param {Object} [options]
 * @param {number} [options.limit=6]
 * @param {Object} [options.filters]
 * @returns {Promise<Array<Object>>} - Danh sách sản phẩm context chuẩn hoá
 */
export async function retrieveProductsForChat(query, options = {}) {
  const limit = options.limit || env.chat.ragTopK || 6
  const cleanQuery = String(query || '').trim()

  if (!cleanQuery || !isProductQuery(cleanQuery)) {
    return []
  }

  // 1. Gọi Gemini Embedding cho câu truy vấn
  let geminiQueryVector = null
  try {
    geminiQueryVector = await embedSearchQuery(cleanQuery)
  } catch (err) {
    console.warn(`[catalogRetrieval] Không thể sinh Gemini query embedding: ${err.message}`)
  }

  // 2. Atlas $vectorSearch trên gemini_embedding_vector (768 chiều)
  if (Array.isArray(geminiQueryVector) && geminiQueryVector.length === 768) {
    try {
      const atlasPipeline = [
        {
          $vectorSearch: {
            index: env.gemini.atlasVectorIndex,
            path: 'gemini_embedding_vector',
            queryVector: geminiQueryVector,
            numCandidates: 100,
            limit: Math.max(limit * 3, 20),
            filter: {
              $and: [
                { is_deleted: { $eq: false } },
                { status: { $eq: 'available' } },
                { embedding_status: { $eq: 'ready' } },
              ],
            },
          },
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'category_id',
            foreignField: '_id',
            as: 'category_id',
          },
        },
        { $unwind: { path: '$category_id', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand_id',
            foreignField: '_id',
            as: 'brand_id',
          },
        },
        { $unwind: { path: '$brand_id', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            name: 1,
            category_id: 1,
            brand_id: 1,
            brand: 1,
            description: 1,
            base_price: 1,
            sale_price: 1,
            images: 1,
            image_assets: 1,
            variants: 1,
            total_stock: 1,
            status: 1,
            is_deleted: 1,
            createdAt: 1,
            score: { $meta: 'vectorSearchScore' },
          },
        },
      ]

      const atlasResults = await Product.aggregate(atlasPipeline)

      if (atlasResults && atlasResults.length > 0) {
        const ranked = atlasResults
          .map((p) => {
            const rawVectorScore = Number(p.score || 0)
            const lexical = calculateLexicalScore(p, cleanQuery)
            const hybrid = rawVectorScore * 0.75 + lexical * 0.25
            return sanitizeProductForChat(p, hybrid)
          })
          .filter((p) => p.score >= 0.3)
          .sort((a, b) => b.score - a.score)

        if (ranked.length > 0) {
          return await attachReviewsToProducts(ranked.slice(0, limit))
        }
      }
    } catch (atlasErr) {
      console.warn(`[catalogRetrieval] Atlas $vectorSearch không khả dụng, chuyển sang In-memory Cosine: ${atlasErr.message}`)
    }

    // Fallback 1: In-memory Cosine Similarity trên Gemini 768 vector
    try {
      const candidates = await Product.find({
        is_deleted: false,
        status: 'available',
        embedding_status: 'ready',
        gemini_embedding_vector: { $exists: true, $ne: [] },
      })
        .populate('category_id', 'name slug')
        .populate('brand_id', 'name slug')
        .lean()

      if (candidates.length > 0) {
        const ranked = candidates
          .map((p) => {
            const cosine = calculateCosineSimilarity(geminiQueryVector, p.gemini_embedding_vector)
            const lexical = calculateLexicalScore(p, cleanQuery)
            const hybrid = cosine * 0.75 + lexical * 0.25
            return sanitizeProductForChat(p, hybrid)
          })
          .filter((p) => p.score >= 0.3)
          .sort((a, b) => b.score - a.score)

        if (ranked.length > 0) {
          return await attachReviewsToProducts(ranked.slice(0, limit))
        }
      }
    } catch (cosineErr) {
      console.warn(`[catalogRetrieval] In-memory Gemini Cosine error: ${cosineErr.message}`)
    }
  }

  // Fallback 2: Lexical Keyword / Regex Search
  try {
    const terms = cleanQuery.split(/\s+/).filter((w) => w.length >= 2).slice(0, 10)
    const orConditions = terms.flatMap((term) => [
      { name: { $regex: term, $options: 'i' } },
      { brand: { $regex: term, $options: 'i' } },
      { description: { $regex: term, $options: 'i' } },
    ])

    const keywordFilter = {
      is_deleted: false,
      status: 'available',
      ...(orConditions.length ? { $or: orConditions } : {}),
    }

    const keywordCandidates = await Product.find(keywordFilter)
      .populate('category_id', 'name slug')
      .populate('brand_id', 'name slug')
      .limit(limit * 3)
      .lean()

    const ranked = keywordCandidates
      .map((p) => {
        const lexical = calculateLexicalScore(p, cleanQuery)
        return sanitizeProductForChat(p, lexical)
      })
      .filter((p) => p.score > 0)
      .sort((a, b) => b.score - a.score)

    return await attachReviewsToProducts(ranked.slice(0, limit))
  } catch (kwErr) {
    console.error(`[catalogRetrieval] Keyword search fallback error: ${kwErr.message}`)
    return []
  }
}

/**
 * Đính kèm thống kê đánh giá và các nhận xét chân thực của khách hàng vào danh sách sản phẩm
 * @param {Array<Object>} products
 * @returns {Promise<Array<Object>>}
 */
export async function attachReviewsToProducts(products) {
  if (!Array.isArray(products) || products.length === 0) return products

  try {
    const productIds = products.map((p) => p.id).filter(Boolean)
    const reviews = await Review.find({ productId: { $in: productIds } })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .lean()

    const reviewsByProductId = new Map()
    reviews.forEach((r) => {
      const pid = String(r.productId)
      if (!reviewsByProductId.has(pid)) {
        reviewsByProductId.set(pid, [])
      }
      reviewsByProductId.get(pid).push(r)
    })

    return products.map((p) => {
      const pReviews = reviewsByProductId.get(p.id) || []
      const count = pReviews.length
      const average = count ? Number((pReviews.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1)) : 0
      const topReviews = pReviews.slice(0, 3).map((r) => ({
        rating: r.rating,
        userName: r.userId?.name || 'Khách hàng',
        color: r.color || '',
        size: r.size || '',
        content: r.content,
      }))

      return {
        ...p,
        reviewSummary: {
          count,
          average,
          topReviews,
        },
      }
    })
  } catch (err) {
    console.warn(`[catalogRetrieval] Lỗi lấy đánh giá cho sản phẩm: ${err.message}`)
    return products
  }
}

export default {
  retrieveProductsForChat,
  calculateCosineSimilarity,
  calculateLexicalScore,
  sanitizeProductForChat,
}
