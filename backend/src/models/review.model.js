import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variantSku: { type: String, required: true, trim: true, index: true },
    color: { type: String, default: '', trim: true },
    size: { type: String, default: '', trim: true },
    selectedOptions: [{
      attribute_name: { type: String, trim: true },
      attribute_slug: { type: String, trim: true },
      value_name: { type: String, trim: true },
      value_slug: { type: String, trim: true },
    }],
    rating: { type: Number, required: true, min: 1, max: 5 },
    content: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: true },
)

reviewSchema.index({ userId: 1, productId: 1, variantSku: 1 }, { unique: true })

export default mongoose.models.Review || mongoose.model('Review', reviewSchema)
