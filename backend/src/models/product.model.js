import mongoose from 'mongoose'

const optionValueSchema = new mongoose.Schema({
  attribute_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Attribute', required: true },
  value_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  attribute_name: { type: String, required: true, trim: true },
  attribute_slug: { type: String, required: true, trim: true },
  value_name: { type: String, required: true, trim: true },
  value_slug: { type: String, required: true, trim: true },
  color_hex: { type: String, default: null },
}, { _id: false })

const optionAxisSchema = new mongoose.Schema({
  attribute_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Attribute', required: true },
  attribute_name: { type: String, required: true, trim: true },
  attribute_slug: { type: String, required: true, trim: true },
  value_ids: [{ type: mongoose.Schema.Types.ObjectId, required: true }],
}, { _id: false })

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    brand_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', default: null, index: true },
    brand: { type: String, default: '', trim: true },
    description: { type: String, default: '' },
    base_price: { type: Number, required: true, min: 0 },
    sale_price: { type: Number, default: null },
    images: [{ type: String }],
    image_assets: [{ url: { type: String, required: true }, public_id: { type: String, default: null } }],
    gallery_asset_ids: [{ type: mongoose.Schema.Types.ObjectId }],
    option_axes: { type: [optionAxisSchema], default: [] },
    variants: [
      {
        sku: { type: String, required: true },
        option_values: { type: [optionValueSchema], default: [] },
        color: { type: String, default: '' },
        size: { type: String, default: '' },
        stock: { type: Number, required: true, min: 0 },
        base_price: { type: Number, default: null, min: 0 },
        sale_price: { type: Number, default: null, min: 0 },
        image_asset_ids: [{ type: mongoose.Schema.Types.ObjectId }],
      }
    ],
    total_stock: { type: Number, default: 0, min: 0, index: true },
    business_enabled: { type: Boolean, default: true, index: true },
    status: { type: String, enum: ['available', 'hidden', 'out_of_stock'], default: 'available', index: true },
    is_deleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    embedding_vector: { type: [Number], default: [] },
    gemini_embedding_vector: { type: [Number], default: [] },
    embedding_model: { type: String, default: null },
    embedding_dimension: { type: Number, default: null },
    embedding_status: { type: String, enum: ['pending', 'ready', 'failed'], default: 'pending', index: true },
    embedding_updated_at: { type: Date, default: null },
    embedding_content_hash: { type: String, default: null },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, collection: 'products' }
);

productSchema.index({ 'variants.sku': 1 }, { unique: true })
productSchema.index({ is_deleted: 1, business_enabled: 1, status: 1, createdAt: -1 })

productSchema.pre('validate', function normalizeProduct() {
  if (this.image_assets?.length) this.images = this.image_assets.map((asset) => asset.url)
  else if (this.images?.length) this.image_assets = this.images.map((url) => ({ url, public_id: null }))
  if (!this.gallery_asset_ids?.length && this.image_assets?.length) this.gallery_asset_ids = this.image_assets.slice(0, 5).map((asset) => asset._id)
  const colorNames = new Set((this.variants || []).flatMap((variant) => (variant.option_values || []).filter((option) => ['mau-sac', 'mau', 'color'].includes(option.attribute_slug)).map((option) => option.value_name.trim().toLocaleLowerCase('vi')))); if (colorNames.size && [...colorNames].some((color) => this.name.trim().toLocaleLowerCase('vi').endsWith(' - ' + color) || this.name.trim().toLocaleLowerCase('vi').endsWith(' ' + color))) throw new Error('Product name must not end with a color when color options are used');   const totalStock = (this.variants || []).reduce((sum, variant) => sum + Number(variant.stock || 0), 0)
  this.total_stock = totalStock
  this.status = !this.business_enabled ? 'hidden' : totalStock > 0 ? 'available' : 'out_of_stock'
})

export default mongoose.models.Product || mongoose.model('Product', productSchema)
