import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDatabase } from '../src/config/database.js'
import Category from '../src/models/Category.js'
import Product from '../src/models/product.model.js'

try {
  await connectDatabase()
  let fallback = await Category.findOne({ slug: 'chua-phan-loai' })
  if (!fallback) fallback = await Category.create({ name: 'Chưa phân loại', slug: 'chua-phan-loai', description: 'Danh mục mặc định cho dữ liệu sản phẩm cũ.' })
  const validIds = new Set((await Category.find({}).select('_id').lean()).map((item) => String(item._id)))
  const products = await Product.find({})
  let updated = 0
  for (const product of products) {
    if (!validIds.has(String(product.category_id))) product.category_id = fallback._id
    if (!product.image_assets?.length && product.images?.length) product.image_assets = product.images.map((url) => ({ url, public_id: null }))
    if (typeof product.business_enabled !== 'boolean') product.business_enabled = product.status !== 'hidden'
    await product.save()
    updated += 1
  }
  console.log(`Product catalog migration complete: ${updated} products normalized`)
} finally {
  await mongoose.disconnect()
}
