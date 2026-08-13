import assert from 'node:assert/strict'
import test from 'node:test'
import mongoose from 'mongoose'
import Brand from '../src/models/Brand.js'
import Attribute from '../src/models/Attribute.js'
import Product from '../src/models/product.model.js'
import brandRoutes from '../src/routes/adminBrand.routes.js'
import attributeRoutes from '../src/routes/adminAttribute.routes.js'
import { slugify } from '../src/utils/catalogAdmin.js'

test('catalog taxonomy models expose stable defaults and slugs', () => {
  assert.equal(slugify('Áo Sơ Mi Đen'), 'ao-so-mi-den')
  const brand = new Brand({ name: 'No Brand', slug: 'no-brand' })
  assert.equal(brand.is_system, false)
  const attribute = new Attribute({ name: 'Màu sắc', slug: 'mau-sac', values: [{ name: 'Đen', slug: 'den', color_hex: '#000000' }] })
  assert.equal(attribute.values[0].color_hex, '#000000')
})

test('product variants support flexible options and per-SKU prices', async () => {
  const product = new Product({ name: 'Áo', category_id: new mongoose.Types.ObjectId(), base_price: 100000, variants: [{ sku: 'AO-DEN-M', stock: 2, base_price: 120000, sale_price: 110000, option_values: [{ attribute_id: new mongoose.Types.ObjectId(), value_id: new mongoose.Types.ObjectId(), attribute_name: 'Màu', attribute_slug: 'mau', value_name: 'Đen', value_slug: 'den' }] }] })
  await product.validate()
  assert.equal(product.variants[0].sale_price, 110000)
  assert.equal(product.total_stock, 2)
  assert.equal(product.status, 'available')
})

test('brand and attribute admin routes require authentication and admin access', () => {
  for (const router of [brandRoutes, attributeRoutes]) assert.deepEqual(router.stack.slice(0, 2).map((layer) => layer.name), ['verifyToken', 'checkAdmin'])
})
