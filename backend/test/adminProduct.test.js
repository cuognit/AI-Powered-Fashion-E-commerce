import assert from 'node:assert/strict'
import test from 'node:test'
import mongoose from 'mongoose'
import Product from '../src/models/product.model.js'
import adminProductRoutes from '../src/routes/adminProduct.routes.js'
import adminCategoryRoutes from '../src/routes/adminCategory.routes.js'
import publicProductRoutes from '../src/routes/product.routes.js'
import { createProduct } from '../src/services/adminProductService.js'
import { trashCategory } from '../src/services/adminCategoryService.js'

const id = () => new mongoose.Types.ObjectId()

test('admin catalog routes require authentication and admin access', () => {
  for (const router of [adminProductRoutes, adminCategoryRoutes]) {
    assert.deepEqual(router.stack.slice(0, 2).map((layer) => layer.name), ['verifyToken', 'checkAdmin'])
  }
  assert.deepEqual(publicProductRoutes.stack.map((layer) => Object.keys(layer.route.methods)[0]), ['get', 'get', 'get'])
})

test('product model derives status and total stock from business switch and variants', async () => {
  const product = new Product({ name: 'Áo sơ mi', category_id: id(), base_price: 200000, images: ['https://example.com/a.jpg'], variants: [{ sku: 'SM-1', color: 'Trắng', size: 'M', stock: 0 }] })
  await product.validate()
  assert.equal(product.status, 'out_of_stock')
  assert.equal(product.total_stock, 0)
  assert.equal(product.image_assets[0].url, product.images[0])
  product.variants[0].stock = 4
  await product.validate()
  assert.equal(product.status, 'available')
  assert.equal(product.total_stock, 4)
  product.business_enabled = false
  await product.validate()
  assert.equal(product.status, 'hidden')
})

test('product create validation rejects malformed category before upload persistence', async () => {
  await assert.rejects(() => createProduct({ payload: JSON.stringify({ name: 'Áo', category_id: 'bad-id', base_price: 100, variants: [{ sku: 'A', color: 'Đen', size: 'M', stock: 1 }], image_manifest: [{ type: 'new', index: 0 }] }) }, [], id()), (error) => error.statusCode === 400 && /Danh mục/.test(error.message))
})

test('category deletion is blocked while any active or trashed product references it', async () => {
  const original = Product.countDocuments
  Product.countDocuments = async () => 3
  try { await assert.rejects(() => trashCategory(String(id()), id()), (error) => error.statusCode === 409 && /3 sản phẩm/.test(error.message)) }
  finally { Product.countDocuments = original }
})
