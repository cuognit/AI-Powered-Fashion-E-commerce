import mongoose from 'mongoose'
import WishlistItem from '../models/WishlistItem.js'
import Product from '../models/product.model.js'
import { AppError } from '../utils/AppError.js'

const visibleProduct = { is_deleted: false, status: { $ne: 'hidden' } }

export async function getWishlist(request, response, next) {
  try {
    const records = await WishlistItem.find({ user_id: request.user.sub }).sort({ createdAt: -1 })
      .populate({ path: 'product_id', match: visibleProduct, select: '_id name brand description images base_price sale_price status variants' }).lean()
    const items = records.filter((record) => record.product_id).map((record) => ({ ...record.product_id, favoritedAt: record.createdAt }))
    response.json({ items, count: items.length })
  } catch (error) { next(error) }
}

export async function addWishlistItem(request, response, next) {
  try {
    const { productId } = request.body || {}
    if (!mongoose.isValidObjectId(productId)) throw new AppError('Mã sản phẩm không hợp lệ', 400)
    const product = await Product.findOne({ _id: productId, ...visibleProduct }).select('_id name brand description images base_price sale_price status variants').lean()
    if (!product) throw new AppError('Sản phẩm không tồn tại hoặc không còn hiển thị', 404)
    const record = await WishlistItem.findOneAndUpdate(
      { user_id: request.user.sub, product_id: productId },
      { $setOnInsert: { user_id: request.user.sub, product_id: productId } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean()
    response.json({ item: { ...product, favoritedAt: record.createdAt } })
  } catch (error) { next(error) }
}

export async function removeWishlistItem(request, response, next) {
  try {
    if (!mongoose.isValidObjectId(request.params.productId)) throw new AppError('Mã sản phẩm không hợp lệ', 400)
    await WishlistItem.deleteOne({ user_id: request.user.sub, product_id: request.params.productId })
    response.json({ success: true })
  } catch (error) { next(error) }
}
