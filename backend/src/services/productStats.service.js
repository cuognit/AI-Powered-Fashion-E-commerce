import mongoose from 'mongoose'
import Order from '../models/Order.js'
import Review from '../models/review.model.js'

/**
 * Đính kèm số lượng đã bán (sold_count) và điểm đánh giá trung bình (average_rating, reviews_count)
 * vào danh sách sản phẩm bằng batch query nhanh.
 * @param {Array<Object>} products - Mảng sản phẩm (document hoặc plain object)
 * @returns {Promise<Array<Object>>}
 */
export async function attachStatsToProducts(products) {
  if (!Array.isArray(products) || products.length === 0) return products

  try {
    const productIds = products.map((p) => p._id || p.id).filter(Boolean)
    if (productIds.length === 0) return products

    // Nếu Mongoose chưa kết nối (ví dụ trong unit tests offline), trả về fallback ngay lập tức
    if (mongoose.connection.readyState !== 1) {
      return products.map((p) => {
        const base = typeof p.toObject === 'function' ? p.toObject() : { ...p }
        const sold = base.sold_count ?? base.unitsSold ?? 0
        const rating = base.average_rating ?? base.rating ?? 0
        const reviewsCount = base.reviews_count ?? base.reviewSummary?.count ?? 0
        return {
          ...base,
          sold_count: sold,
          unitsSold: sold,
          average_rating: rating,
          rating,
          reviews_count: reviewsCount,
        }
      })
    }

    // 1. Truy vấn thống kê số lượng đã bán từ Order (loại bỏ đơn hủy)
    // 2. Truy vấn thống kê đánh giá trung bình từ Review
    const [orderStats, reviewStats] = await Promise.all([
      Order.aggregate([
        { $match: { status: { $ne: 'canceled' }, 'items.product_id': { $in: productIds } } },
        { $unwind: '$items' },
        { $match: { 'items.product_id': { $in: productIds } } },
        {
          $group: {
            _id: '$items.product_id',
            soldCount: { $sum: '$items.quantity' },
          },
        },
      ]),
      Review.aggregate([
        { $match: { productId: { $in: productIds } } },
        {
          $group: {
            _id: '$productId',
            averageRating: { $avg: '$rating' },
            reviewsCount: { $sum: 1 },
          },
        },
      ]),
    ])

    const soldMap = new Map(orderStats.map((s) => [String(s._id), s.soldCount]))
    const reviewMap = new Map(
      reviewStats.map((r) => [
        String(r._id),
        {
          averageRating: Number(r.averageRating ? r.averageRating.toFixed(1) : 0),
          reviewsCount: r.reviewsCount || 0,
        },
      ]),
    )

    return products.map((p) => {
      const idStr = String(p._id || p.id)
      const sold = soldMap.get(idStr) ?? p.sold_count ?? p.unitsSold ?? 0
      const reviewInfo = reviewMap.get(idStr) || {
        averageRating: p.average_rating ?? p.rating ?? 0,
        reviewsCount: p.reviews_count ?? p.reviewSummary?.count ?? 0,
      }

      const base = typeof p.toObject === 'function' ? p.toObject() : { ...p }

      return {
        ...base,
        sold_count: sold,
        unitsSold: sold,
        average_rating: reviewInfo.averageRating,
        rating: reviewInfo.averageRating,
        reviews_count: reviewInfo.reviewsCount,
      }
    })
  } catch (err) {
    console.warn('[productStats.service] Lỗi khi đính kèm thống kê sản phẩm:', err.message)
    return products
  }
}

/**
 * Đính kèm thống kê cho một sản phẩm đơn lẻ
 */
export async function attachStatsToSingleProduct(product) {
  if (!product) return product
  const [enriched] = await attachStatsToProducts([product])
  return enriched || product
}

export default {
  attachStatsToProducts,
  attachStatsToSingleProduct,
}
