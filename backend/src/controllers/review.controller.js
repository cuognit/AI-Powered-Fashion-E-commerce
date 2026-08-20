import mongoose from 'mongoose'
import { GoogleGenAI } from '@google/genai'
import Order from '../models/Order.js'
import Product from '../models/product.model.js'
import Review from '../models/review.model.js'
import geminiKeyPool from '../services/geminiKeyPool.js'
import env from '../config/env.js'
import { AppError } from '../utils/AppError.js'

const MAX_CONTENT_LENGTH = 1000

// In-memory cache cho AI Review Summaries (TTL: 10 phút)
const summaryCache = new Map()

function productIdOf(value) {
  if (!mongoose.isValidObjectId(value)) throw new AppError('Sản phẩm không hợp lệ', 400)
  return new mongoose.Types.ObjectId(value)
}

function serialize(review) {
  return {
    id: String(review._id),
    user: { id: String(review.userId?._id || review.userId), name: review.userId?.name || 'Khách hàng' },
    productId: String(review.productId),
    variantSku: review.variantSku,
    rating: review.rating,
    content: review.content,
    color: review.color || '',
    size: review.size || '',
    selectedOptions: review.selectedOptions || [],
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  }
}

function validateReviewInput(rating, content) {
  const text = String(content || '').trim()
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new AppError('Điểm đánh giá phải từ 1 đến 5 sao', 400)
  if (!text || text.length > MAX_CONTENT_LENGTH) throw new AppError(`Nội dung phải có từ 1 đến ${MAX_CONTENT_LENGTH} ký tự`, 400)
  return text
}

export async function getProductReviews(request, response, next) {
  try {
    const productId = productIdOf(request.params.productId)
    const reviews = await Review.find({ productId }).populate('userId', 'name').sort({ createdAt: -1 })
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    const total = reviews.reduce((sum, review) => {
      distribution[review.rating] += 1
      return sum + review.rating
    }, 0)
    response.json({
      success: true,
      data: {
        reviews: reviews.map(serialize),
        summary: {
          count: reviews.length,
          average: reviews.length ? Number((total / reviews.length).toFixed(1)) : 0,
          distribution,
        },
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Tạo tóm tắt thông minh bằng AI từ toàn bộ đánh giá thực tế của sản phẩm
 */
export async function getProductReviewAiSummary(request, response, next) {
  try {
    const productId = productIdOf(request.params.productId)
    const product = await Product.findOne({ _id: productId, is_deleted: { $ne: true } })
      .populate('category_id', 'name')
      .populate('brand_id', 'name')
      .lean()

    if (!product) {
      throw new AppError('Không tìm thấy sản phẩm', 404)
    }

    const reviews = await Review.find({ productId })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(30)
      .lean()

    const count = reviews.length
    if (count === 0) {
      return response.json({
        success: true,
        data: {
          count: 0,
          average: 0,
          hasSummary: false,
          overview: 'Sản phẩm chưa có đánh giá nào từ khách hàng.',
          pros: [],
          sizeAdvice: [],
          careTips: [],
        },
      })
    }

    const total = reviews.reduce((sum, r) => sum + r.rating, 0)
    const average = Number((total / count).toFixed(1))

    // Cache key dựa trên productId + số lượng review + thời gian review mới nhất
    const latestReviewTime = reviews[0]?.updatedAt ? new Date(reviews[0].updatedAt).getTime() : 0
    const cacheKey = `${String(productId)}_${count}_${latestReviewTime}`
    const cached = summaryCache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) {
      return response.json({ success: true, data: cached.data })
    }

    const reviewTexts = reviews
      .map((r, i) => {
        const variantInfo = [r.color, r.size].filter(Boolean).join(' - ')
        return `${i + 1}. [${r.rating}★${variantInfo ? ` | ${variantInfo}` : ''}] ${r.content}`
      })
      .join('\n')

    const prompt = `Bạn là chuyên gia phân tích trải nghiệm mua sắm thời trang. Dưới đây là danh sách đánh giá thực tế của khách hàng về sản phẩm "${product.name}":

${reviewTexts}

Hãy phân tích và tóm tắt trung thực, khách quan cả ưu điểm lẫn nhược điểm dưới dạng JSON duy nhất (không bọc trong markdown codeblock):
{
  "overview": "1-2 câu tóm tắt tổng quan mức độ hài lòng và cảm nhận chung của khách hàng",
  "pros": ["Ưu điểm nổi bật 1 (chất vải, độ thoáng, màu sắc)", "Ưu điểm nổi bật 2 (đường may, form dáng)"],
  "cons": ["Nhược điểm / Điểm bị chê hoặc cần lưu ý từ khách (ví dụ: vải dễ nhăn nếu không là ủi, màu thực tế hơi đậm hơn ảnh, vải ít co giãn...). Nếu không có chê trách nào thì ghi 'Không có điểm trừ đáng kể'"],
  "sizeAdvice": ["Lời khuyên chọn size/form dáng dựa trên nhận xét người mua (ví dụ: form ôm, nên tăng 1 size nếu thích thoải mái)"],
  "careTips": ["Lưu ý giặt ủi/bảo quản chất liệu (nếu có nhận xét liên quan, nếu không để mảng rỗng)"]
}`

    const aiSummaryResult = await geminiKeyPool.executeWithRetry('generateReviewAiSummary', async (keyObj) => {
      const ai = new GoogleGenAI({ apiKey: keyObj.apiKey })
      const res = await ai.models.generateContent({
        model: env.gemini.model || 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      })
      const text = res.text || ''
      const cleanJson = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim()
      return JSON.parse(cleanJson)
    })

    const resultData = {
      count,
      average,
      hasSummary: true,
      overview: aiSummaryResult.overview || `Đánh giá trung bình ${average}/5★ dựa trên ${count} nhận xét thực tế.`,
      pros: Array.isArray(aiSummaryResult.pros) ? aiSummaryResult.pros : [],
      cons: Array.isArray(aiSummaryResult.cons) ? aiSummaryResult.cons : [],
      sizeAdvice: Array.isArray(aiSummaryResult.sizeAdvice) ? aiSummaryResult.sizeAdvice : [],
      careTips: Array.isArray(aiSummaryResult.careTips) ? aiSummaryResult.careTips : [],
      cachedAt: new Date().toISOString(),
    }

    summaryCache.set(cacheKey, { data: resultData, expiresAt: Date.now() + 10 * 60 * 1000 })

    return response.json({
      success: true,
      data: resultData,
    })
  } catch (error) {
    try {
      const productId = productIdOf(request.params.productId)
      const reviews = await Review.find({ productId }).lean()
      const count = reviews.length
      const total = reviews.reduce((sum, r) => sum + r.rating, 0)
      const average = count ? Number((total / count).toFixed(1)) : 0
      return response.json({
        success: true,
        data: {
          count,
          average,
          hasSummary: false,
          overview: `Sản phẩm đạt đánh giá trung bình ${average}/5★ từ ${count} khách hàng.`,
          pros: [],
          cons: [],
          sizeAdvice: [],
          careTips: [],
        },
      })
    } catch {
      next(error)
    }
  }
}

export async function getReviewEligibility(request, response, next) {
  try {
    const productId = productIdOf(request.params.productId)
    const product = await Product.findOne({ _id: productId, is_deleted: { $ne: true } }).lean()
    if (!product) throw new AppError('Không tìm thấy sản phẩm', 404)
    const orders = await Order.find({ user_id: request.user.sub, status: 'completed', items: { $elemMatch: { product_id: productId } } })
      .select('items')
      .lean()
    const purchased = new Map()
    orders
      .flatMap((order) => order.items || [])
      .filter((item) => String(item.product_id) === String(productId))
      .forEach((item) => {
        if (!purchased.has(item.variant_sku)) purchased.set(item.variant_sku, item)
      })
    const reviewed = await Review.find({ userId: request.user.sub, productId }).lean()
    const reviewsBySku = new Map(reviewed.filter((item) => item.variantSku).map((item) => [item.variantSku, item]))
    const variants = [...purchased.entries()].map(([variantSku, item]) => ({
      variantSku,
      color: item.color || '',
      size: item.size || '',
      selectedOptions: item.selected_options || [],
      review: reviewsBySku.has(variantSku) ? serialize(reviewsBySku.get(variantSku)) : null,
    }))
    response.json({ success: true, data: { variants } })
  } catch (error) {
    next(error)
  }
}

export async function createReview(request, response, next) {
  try {
    const { productId: rawProductId, variantSku, rating, content } = request.body
    const productId = productIdOf(rawProductId)
    const sku = String(variantSku || '').trim()
    const text = validateReviewInput(rating, content)
    if (!sku) throw new AppError('Vui lòng chọn biến thể đã mua', 400)
    const product = await Product.findOne({ _id: productId, is_deleted: { $ne: true } }).lean()
    if (!product) throw new AppError('Không tìm thấy sản phẩm', 404)
    const variant = product.variants.find((item) => item.sku === sku)
    if (!variant) throw new AppError('Biến thể không thuộc sản phẩm này', 400)
    const order = await Order.findOne({ user_id: request.user.sub, status: 'completed', items: { $elemMatch: { product_id: productId, variant_sku: sku } } }).lean()
    if (!order) throw new AppError('Bạn chỉ có thể đánh giá sản phẩm đã mua trong đơn hoàn tất', 403)
    if (await Review.exists({ userId: request.user.sub, productId, variantSku: sku })) throw new AppError('Bạn đã đánh giá biến thể này rồi', 409)
    const orderedItem = order.items.find((item) => String(item.product_id) === String(productId) && item.variant_sku === sku)
    const review = await new Review({
      userId: request.user.sub,
      productId,
      variantSku: sku,
      rating,
      content: text,
      color: orderedItem?.color || variant.color || '',
      size: orderedItem?.size || variant.size || '',
      selectedOptions: orderedItem?.selected_options || variant.option_values || [],
    }).save()
    response.status(201).json({ success: true, message: 'Đánh giá thành công', data: serialize(await review.populate('userId', 'name')) })
  } catch (error) {
    if (error?.code === 11000) return next(new AppError('Bạn đã đánh giá biến thể này rồi', 409))
    next(error)
  }
}

export async function updateReview(request, response, next) {
  try {
    if (!mongoose.isValidObjectId(request.params.reviewId)) throw new AppError('Review không hợp lệ', 400)
    const text = validateReviewInput(request.body.rating, request.body.content)
    const review = await Review.findOneAndUpdate(
      { _id: request.params.reviewId, userId: request.user.sub },
      { $set: { rating: request.body.rating, content: text } },
      { new: true, runValidators: true },
    ).populate('userId', 'name')
    if (!review) {
      if (await Review.exists({ _id: request.params.reviewId })) throw new AppError('Bạn không có quyền sửa review này', 403)
      throw new AppError('Không tìm thấy review', 404)
    }
    response.json({ success: true, message: 'Đã cập nhật đánh giá', data: serialize(review) })
  } catch (error) {
    next(error)
  }
}

export async function deleteReview(request, response, next) {
  try {
    if (!mongoose.isValidObjectId(request.params.reviewId)) throw new AppError('Review không hợp lệ', 400)
    const review = await Review.findById(request.params.reviewId)
    if (!review) throw new AppError('Không tìm thấy review', 404)
    if (String(review.userId) !== String(request.user.sub)) throw new AppError('Bạn không có quyền xóa review này', 403)
    await review.deleteOne()
    response.json({ success: true, message: 'Đã xóa đánh giá' })
  } catch (error) {
    next(error)
  }
}
