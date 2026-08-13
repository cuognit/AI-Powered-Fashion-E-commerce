import mongoose from 'mongoose'
import Order from '../models/Order.js'
import Product from '../models/Product.js'
import Review from '../models/review.model.js'
import { AppError } from '../utils/AppError.js'

const MAX_CONTENT_LENGTH = 1000

function productIdOf(value) {
  if (!mongoose.isValidObjectId(value)) throw new AppError('Sản phẩm không hợp lệ', 400)
  return new mongoose.Types.ObjectId(value)
}

function serialize(review) {
  return {
    id: String(review._id), user: { id: String(review.userId?._id || review.userId), name: review.userId?.name || 'Khách hàng' },
    productId: String(review.productId), variantSku: review.variantSku, rating: review.rating, content: review.content,
    color: review.color || '', size: review.size || '', selectedOptions: review.selectedOptions || [], createdAt: review.createdAt, updatedAt: review.updatedAt,
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
    const total = reviews.reduce((sum, review) => { distribution[review.rating] += 1; return sum + review.rating }, 0)
    response.json({ success: true, data: { reviews: reviews.map(serialize), summary: { count: reviews.length, average: reviews.length ? Number((total / reviews.length).toFixed(1)) : 0, distribution } } })
  } catch (error) { next(error) }
}

export async function getReviewEligibility(request, response, next) {
  try {
    const productId = productIdOf(request.params.productId)
    const product = await Product.findOne({ _id: productId, is_deleted: { $ne: true } }).lean()
    if (!product) throw new AppError('Không tìm thấy sản phẩm', 404)
    const orders = await Order.find({ user_id: request.user.sub, status: 'completed', items: { $elemMatch: { product_id: productId } } }).select('items').lean()
    const purchased = new Map()
    orders.flatMap((order) => order.items || []).filter((item) => String(item.product_id) === String(productId)).forEach((item) => {
      if (!purchased.has(item.variant_sku)) purchased.set(item.variant_sku, item)
    })
    const reviewed = await Review.find({ userId: request.user.sub, productId }).lean()
    const reviewsBySku = new Map(reviewed.filter((item) => item.variantSku).map((item) => [item.variantSku, item]))
    const variants = [...purchased.entries()].map(([variantSku, item]) => ({
      variantSku, color: item.color || '', size: item.size || '', selectedOptions: item.selected_options || [],
      review: reviewsBySku.has(variantSku) ? serialize(reviewsBySku.get(variantSku)) : null,
    }))
    response.json({ success: true, data: { variants } })
  } catch (error) { next(error) }
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
    const review = await new Review({ userId: request.user.sub, productId, variantSku: sku, rating, content: text, color: orderedItem?.color || variant.color || '', size: orderedItem?.size || variant.size || '', selectedOptions: orderedItem?.selected_options || variant.option_values || [] }).save()
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
    const review = await Review.findOneAndUpdate({ _id: request.params.reviewId, userId: request.user.sub }, { $set: { rating: request.body.rating, content: text } }, { new: true, runValidators: true }).populate('userId', 'name')
    if (!review) {
      if (await Review.exists({ _id: request.params.reviewId })) throw new AppError('Bạn không có quyền sửa review này', 403)
      throw new AppError('Không tìm thấy review', 404)
    }
    response.json({ success: true, message: 'Đã cập nhật đánh giá', data: serialize(review) })
  } catch (error) { next(error) }
}

export async function deleteReview(request, response, next) {
  try {
    if (!mongoose.isValidObjectId(request.params.reviewId)) throw new AppError('Review không hợp lệ', 400)
    const review = await Review.findById(request.params.reviewId)
    if (!review) throw new AppError('Không tìm thấy review', 404)
    if (String(review.userId) !== String(request.user.sub)) throw new AppError('Bạn không có quyền xóa review này', 403)
    await review.deleteOne()
    response.json({ success: true, message: 'Đã xóa đánh giá' })
  } catch (error) { next(error) }
}
