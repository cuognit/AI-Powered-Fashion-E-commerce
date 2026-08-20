import crypto from 'node:crypto'
import { GoogleGenAI } from '@google/genai'
import env from '../config/env.js'
import geminiKeyPool from './geminiKeyPool.js'

/**
 * Xây dựng đoạn văn bản đại diện cho sản phẩm phục vụ sinh Vector Embedding.
 * @param {Object} product - Đối tượng Product
 * @returns {string} - Chuỗi văn bản đại diện
 */
export function buildProductEmbeddingText(product = {}) {
  const parts = []

  if (product.name) parts.push(`Tên: ${product.name.trim()}`)

  const brandName = product.brand_id?.name || product.brand
  if (brandName) parts.push(`Thương hiệu: ${String(brandName).trim()}`)

  const categoryName = product.category_id?.name || product.category
  if (categoryName) parts.push(`Danh mục: ${String(categoryName).trim()}`)

  if (product.description) parts.push(`Mô tả: ${product.description.trim()}`)

  if (Array.isArray(product.variants) && product.variants.length > 0) {
    const colors = [...new Set(product.variants.map((v) => v.color).filter(Boolean))]
    const sizes = [...new Set(product.variants.map((v) => v.size).filter(Boolean))]
    if (colors.length) parts.push(`Màu sắc: ${colors.join(', ')}`)
    if (sizes.length) parts.push(`Kích thước: ${sizes.join(', ')}`)

    const dynamicOptions = [
      ...new Set(
        product.variants.flatMap((variant) =>
          (variant.option_values || []).map((option) => `${option.attribute_name}: ${option.value_name}`),
        ),
      ),
    ]
    if (dynamicOptions.length) parts.push(`Thuộc tính: ${dynamicOptions.join(', ')}`)
  }

  if (product.status) {
    parts.push(`Trạng thái: ${product.status === 'available' ? 'Còn hàng' : product.status === 'out_of_stock' ? 'Hết hàng' : 'Ẩn'}`)
  }

  return parts.join('. ')
}

/**
 * Tạo chuỗi hash SHA-256 từ nội dung text của sản phẩm.
 * @param {string} text 
 * @returns {string}
 */
export function calculateContentHash(text) {
  return crypto.createHash('sha256').update(String(text || '').trim()).digest('hex')
}

/**
 * Gọi Gemini Embedding API để tạo vector 768 chiều cho Document (Sản phẩm).
 * @param {Object|string} productOrText - Object sản phẩm hoặc chuỗi text
 * @param {Object} [options]
 * @returns {Promise<number[]|null>} - Mảng vector 768 chiều
 */
export async function embedProductDocument(productOrText, options = {}) {
  let title = 'none'
  let text = ''

  if (typeof productOrText === 'string') {
    text = productOrText.trim()
  } else if (productOrText && typeof productOrText === 'object') {
    title = productOrText.name || 'none'
    text = buildProductEmbeddingText(productOrText)
  }

  if (!text) return null

  const formattedDoc = `title: ${title} | text: ${text}`
  const modelName = options.model || env.gemini.embeddingModel
  const dimension = options.dimension || env.gemini.embeddingDimension

  return geminiKeyPool.executeWithRetry('embedProductDocument', async (keyObj) => {
    const ai = new GoogleGenAI({ apiKey: keyObj.apiKey })
    const response = await ai.models.embedContent({
      model: modelName,
      contents: formattedDoc,
      config: {
        outputDimensionality: dimension,
      },
    })

    const values = response?.embedding?.values || response?.embeddings?.[0]?.values
    if (Array.isArray(values) && values.length === dimension) {
      return values
    }

    throw new Error(`Kích thước vector không hợp lệ (nhận ${values?.length}, yêu cầu ${dimension})`)
  })
}

/**
 * Gọi Gemini Embedding API để tạo vector 768 chiều cho Query tìm kiếm của người dùng.
 * @param {string} query - Câu truy vấn tìm kiếm
 * @param {Object} [options]
 * @returns {Promise<number[]|null>} - Mảng vector 768 chiều
 */
export async function embedSearchQuery(query, options = {}) {
  if (!query || typeof query !== 'string' || !query.trim()) {
    return null
  }

  const formattedQuery = `task: search result | query: ${query.trim()}`
  const modelName = options.model || env.gemini.embeddingModel
  const dimension = options.dimension || env.gemini.embeddingDimension

  return geminiKeyPool.executeWithRetry('embedSearchQuery', async (keyObj) => {
    const ai = new GoogleGenAI({ apiKey: keyObj.apiKey })
    const response = await ai.models.embedContent({
      model: modelName,
      contents: formattedQuery,
      config: {
        outputDimensionality: dimension,
      },
    })

    const values = response?.embedding?.values || response?.embeddings?.[0]?.values
    if (Array.isArray(values) && values.length === dimension) {
      return values
    }

    throw new Error(`Kích thước vector không hợp lệ (nhận ${values?.length}, yêu cầu ${dimension})`)
  })
}

export default {
  buildProductEmbeddingText,
  calculateContentHash,
  embedProductDocument,
  embedSearchQuery,
}
