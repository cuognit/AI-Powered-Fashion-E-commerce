import mongoose from 'mongoose'

const variantSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, trim: true },
    color: { type: String, required: true, trim: true },
    size: { type: String, required: true, trim: true },
    stock: { type: Number, required: true, min: 0 },
  },
  { _id: false },
)

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      index: true,
    },
    brand: { type: String, trim: true },
    base_price: { type: Number, required: true, min: 0 },
    sale_price: { type: Number, default: null, min: 0 },
    images: [{ type: String }],
    variants: [variantSchema],
    status: {
      type: String,
      enum: ['available', 'hidden', 'out_of_stock'],
      default: 'available',
    },
    is_deleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    embedding_vector: [{ type: Number }],
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'products' },
)

// Đảm bảo SKU là duy nhất trên toàn bộ variants của mọi sản phẩm.
productSchema.index({ 'variants.sku': 1 }, { unique: true })
productSchema.index({ is_deleted: 1, status: 1 })

export default mongoose.model('Product', productSchema)
