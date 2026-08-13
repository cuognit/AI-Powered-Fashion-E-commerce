import mongoose from 'mongoose'

const paymentTransactionSchema = new mongoose.Schema({
  txn_ref: { type: String, required: true, unique: true, index: true },
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  provider: { type: String, enum: ['VNPAY'], default: 'VNPAY' },
  amount: { type: Number, required: true, min: 1 },
  status: { type: String, enum: ['pending', 'payment_review', 'paid', 'failed', 'expired'], default: 'pending', index: true },
  expires_at: { type: Date, required: true, index: true },
  transaction_date: { type: String, default: null },
  query_attempts: { type: Number, default: 0 },
  last_queried_at: { type: Date, default: null },
  next_query_at: { type: Date, default: null, index: true },
  query_response_code: { type: String, default: null },
  processed_at: { type: Date, default: null },
  vnp_transaction_no: { type: String, default: null },
  response_code: { type: String, default: null },
  transaction_status: { type: String, default: null },
  bank_code: { type: String, default: null },
  card_type: { type: String, default: null },
  pay_date: { type: String, default: null },
}, { timestamps: true, collection: 'payment_transactions' })

export default mongoose.model('PaymentTransaction', paymentTransactionSchema)
