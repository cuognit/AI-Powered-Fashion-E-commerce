import mongoose from 'mongoose'

const orderItemSchema = new mongoose.Schema(
  {
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    product_name: { type: String, trim: true },
    variant_sku: { type: String, trim: true },
    image_url: { type: String, default: '' },
    color: { type: String, trim: true },
    size: { type: String, trim: true },
    selected_options: [{
      attribute_name: { type: String, trim: true },
      attribute_slug: { type: String, trim: true },
      value_name: { type: String, trim: true },
      value_slug: { type: String, trim: true },
    }],
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
)

const statusHistorySchema = new mongoose.Schema(
  {
    event: {
      type: String,
      enum: ['order_created', 'payment_confirmed', 'processing', 'ready_to_ship', 'shipped', 'completed', 'canceled', 'refund_requested', 'refund_completed'],
      required: true,
    },
    occurred_at: { type: Date, default: Date.now },
    actor_type: { type: String, enum: ['system', 'customer', 'admin'], default: 'system' },
    actor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    note: { type: String, default: '', trim: true },
  },
  { _id: false },
)

const shipmentSchema = new mongoose.Schema(
  {
    carrier: { type: String, default: '', trim: true },
    tracking_code: { type: String, default: '', trim: true },
    estimated_delivery_at: { type: Date, default: null },
    shipped_at: { type: Date, default: null },
    delivered_at: { type: Date, default: null },
  },
  { _id: false },
)

const cancellationSchema = new mongoose.Schema(
  {
    reason_code: { type: String, default: null },
    note: { type: String, default: '', trim: true },
    canceled_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    canceled_at: { type: Date, default: null },
  },
  { _id: false },
)

const refundSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ['none', 'requested', 'completed'], default: 'none' },
    requested_at: { type: Date, default: null },
    completed_at: { type: Date, default: null },
    reference: { type: String, default: '', trim: true },
    note: { type: String, default: '', trim: true },
    processed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
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
    payment_method: { type: String, enum: ['COD', 'VNPAY'], default: 'COD' },
    payment_status: {
      type: String,
      enum: ['pending_payment', 'payment_review', 'paid', 'failed', 'expired', 'cod_pending'],
      required: true,
      index: true,
    },
    payment_expires_at: { type: Date, default: null, index: true },
    inventory_released_at: { type: Date, default: null },
    status: {
      type: String,
      enum: ['pending', 'processing', 'ready_to_ship', 'shipped', 'completed', 'canceled'],
      default: 'pending',
      index: true,
    },
    cancel_reason: { type: String, default: null },
    status_history: { type: [statusHistorySchema], default: [] },
    shipment: { type: shipmentSchema, default: () => ({}) },
    cancellation: { type: cancellationSchema, default: () => ({}) },
    refund: { type: refundSchema, default: () => ({}) },
    items: [orderItemSchema],
  },
  { timestamps: true, collection: 'orders' },
)

orderSchema.index({ createdAt: 1 })
orderSchema.index({ user_id: 1, createdAt: -1 })
orderSchema.index({ status: 1, createdAt: -1 })

export default mongoose.model('Order', orderSchema)
