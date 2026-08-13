import mongoose from 'mongoose'
import Cart from '../models/Cart.js'
import Product from '../models/product.model.js'
import { AppError } from '../utils/AppError.js'

function validateQuantity(quantity) {
  if (!Number.isInteger(quantity) || quantity < 1) throw new AppError('Số lượng phải là số nguyên dương', 400)
}

async function findAvailableVariant(productId, variantSku) {
  if (!mongoose.isValidObjectId(productId)) throw new AppError('Mã sản phẩm không hợp lệ', 400)
  if (typeof variantSku !== 'string' || !variantSku.trim()) throw new AppError('Vui lòng chọn phiên bản sản phẩm', 400)
  const product = await Product.findOne({ _id: productId, is_deleted: false, status: 'available' }).lean()
  if (!product) throw new AppError('Không tìm thấy sản phẩm khả dụng', 404)
  const variant = product.variants.find((item) => item.sku === variantSku.trim())
  if (!variant) throw new AppError('Không tìm thấy phiên bản sản phẩm', 404)
  if (variant.stock < 1) throw new AppError('Phiên bản sản phẩm đã hết hàng', 409)
  return variant
}

function serializeCart(cart) {
  if (!cart) return { items: [] }
  return { items: cart.items.flatMap((item) => {
    const product = item.product_id
    if (!product || product.is_deleted || product.status !== 'available') return []
    const variant = product.variants.find((entry) => entry.sku === item.variant_sku)
    if (!variant) return []
    return [{
      id: `${product._id}:${variant.sku}`,
      productId: String(product._id), variantSku: variant.sku,
      name: product.name, brand: product.brand, image: product.images?.[0] || '',
      price: product.sale_price ?? product.base_price, basePrice: product.base_price,
      color: variant.color, size: variant.size, stock: variant.stock,
      quantity: item.quantity, isAvailable: variant.stock > 0,
    }]
  }) }
}

async function populatedCart(userId) {
  return Cart.findOne({ user_id: userId }).populate('items.product_id').lean()
}

export async function getCart(userId) { return serializeCart(await populatedCart(userId)) }

export async function addItem(userId, { productId, variantSku, quantity }) {
  validateQuantity(quantity)
  const variant = await findAvailableVariant(productId, variantSku)
  let cart = await Cart.findOne({ user_id: userId })
  if (!cart) cart = new Cart({ user_id: userId, items: [] })
  const existing = cart.items.find((item) => item.variant_sku === variant.sku)
  const nextQuantity = (existing?.quantity || 0) + quantity
  if (nextQuantity > variant.stock) throw new AppError(`Chỉ còn ${variant.stock} sản phẩm trong kho`, 409)
  if (existing) existing.quantity = nextQuantity
  else cart.items.push({ product_id: productId, variant_sku: variant.sku, quantity })
  await cart.save()
  return getCart(userId)
}

export async function setItemQuantity(userId, variantSku, quantity) {
  validateQuantity(quantity)
  const cart = await Cart.findOne({ user_id: userId })
  if (!cart) throw new AppError('Không tìm thấy giỏ hàng', 404)
  const item = cart.items.find((entry) => entry.variant_sku === variantSku)
  if (!item) throw new AppError('Sản phẩm không có trong giỏ hàng', 404)
  const variant = await findAvailableVariant(item.product_id, variantSku)
  if (quantity > variant.stock) throw new AppError(`Chỉ còn ${variant.stock} sản phẩm trong kho`, 409)
  item.quantity = quantity
  await cart.save()
  return getCart(userId)
}

export async function removeItem(userId, variantSku) {
  const cart = await Cart.findOne({ user_id: userId })
  if (!cart) throw new AppError('Không tìm thấy giỏ hàng', 404)
  const initialLength = cart.items.length
  cart.items = cart.items.filter((entry) => entry.variant_sku !== variantSku)
  if (cart.items.length === initialLength) throw new AppError('Sản phẩm không có trong giỏ hàng', 404)
  await cart.save()
  return getCart(userId)
}

export async function clearCart(userId) {
  await Cart.findOneAndDelete({ user_id: userId })
  return { items: [] }
}
