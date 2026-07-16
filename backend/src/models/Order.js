import mongoose from 'mongoose'

const orderItemSchema = new mongoose.Schema(
  {
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    product_name: { type: String, trim: true },
    variant_sku: { type: String, trim: true },
    color: { type: String, trim: true },
    size: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
)

const orderSchema = new mongoose.Schema(
  {
    order_code: { type: String, required: true, unique: true, index: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    shipping_address: { type: String, required: true, trim: true },
    phone_number: { type: String, required: true, trim: true },
    note: { type: String, default: '' },
    total_amount: { type: Number, required: true, min: 0 },
    payment_method: { type: String, default: 'COD' },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'completed', 'canceled'],
      default: 'pending',
      index: true,
    },
    cancel_reason: { type: String, default: null },
    items: [orderItemSchema],
  },
  { timestamps: true, collection: 'orders' },
)

orderSchema.index({ createdAt: 1 })

export default mongoose.model('Order', orderSchema)
