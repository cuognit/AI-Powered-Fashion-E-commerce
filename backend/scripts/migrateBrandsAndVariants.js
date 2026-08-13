import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDatabase } from '../src/config/database.js'
import Attribute from '../src/models/Attribute.js'
import Brand from '../src/models/Brand.js'
import Product from '../src/models/product.model.js'
import { slugify } from '../src/utils/catalogAdmin.js'

const dryRun = process.argv.includes('--dry-run')
const counters = { products: 0, brands: 0, values: 0 }

async function brandFor(name) {
  const clean = String(name || '').trim() || 'Không thương hiệu'
  let row = await Brand.findOne({ slug: slugify(clean) })
  if (!row) { counters.brands += 1; row = new Brand({ name: clean, slug: slugify(clean), description: clean === 'Không thương hiệu' ? 'Thương hiệu hệ thống dành cho sản phẩm chưa xác định.' : '', is_system: clean === 'Không thương hiệu' }); if (!dryRun) await row.save() }
  return row
}
async function attributeFor(name, slug, displayType, values) {
  let row = await Attribute.findOne({ slug }); if (!row) row = new Attribute({ name, slug, display_type: displayType, values: [] })
  for (const raw of [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))]) if (!row.values.some((value) => value.name.toLowerCase() === raw.toLowerCase())) { row.values.push({ name: raw, slug: slugify(raw), color_hex: null }); counters.values += 1 }
  if (!dryRun) await row.save(); return row
}

try {
  await connectDatabase(); const products = await Product.find({})
  const colorAttr = await attributeFor('Màu sắc', 'mau-sac', 'color', products.flatMap((product) => product.variants.map((variant) => variant.color)))
  const sizeAttr = await attributeFor('Kích thước', 'kich-thuoc', 'text', products.flatMap((product) => product.variants.map((variant) => variant.size)))
  for (const product of products) {
    const brand = await brandFor(product.brand); product.brand_id = brand._id; product.brand = brand.name
    if (!product.image_assets?.length && product.images?.length) product.image_assets = product.images.map((url) => ({ url, public_id: null }))
    if (!product.gallery_asset_ids?.length) product.gallery_asset_ids = product.image_assets.slice(0, 5).map((asset) => asset._id)
    if (!product.option_axes?.length) {
      const pair = (attribute, name) => { const value = attribute.values.find((item) => item.name.toLowerCase() === String(name || '').toLowerCase()); return value && { attribute_id: attribute._id, value_id: value._id, attribute_name: attribute.name, attribute_slug: attribute.slug, value_name: value.name, value_slug: value.slug, color_hex: value.color_hex } }
      product.variants.forEach((variant) => { variant.option_values = [[colorAttr, variant.color], [sizeAttr, variant.size]].map(([attribute, name]) => pair(attribute, name)).filter(Boolean) })
      product.option_axes = [colorAttr, sizeAttr].map((attribute) => ({ attribute_id: attribute._id, attribute_name: attribute.name, attribute_slug: attribute.slug, value_ids: [...new Set(product.variants.flatMap((variant) => variant.option_values.filter((option) => String(option.attribute_id) === String(attribute._id)).map((option) => String(option.value_id))))] })).filter((axis) => axis.value_ids.length)
    }
    if (!dryRun) await product.save(); counters.products += 1
  }
  console.log(`${dryRun ? '[DRY RUN] ' : ''}Migration complete`, counters)
} finally { await mongoose.disconnect() }
