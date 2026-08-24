import mongoose from 'mongoose'

const virtualTryOnSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
      index: true,
    },
    person_image: {
      type: String,
      required: true,
      trim: true,
    },
    garment_image: {
      type: String,
      required: true,
      trim: true,
    },
    result_image: {
      type: String,
      default: null,
      trim: true,
    },
    category: {
      type: String,
      enum: ['upper_body', 'lower_body', 'dresses', 'all'],
      default: 'upper_body',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    error_message: {
      type: String,
      default: null,
    },
    denoise_steps: {
      type: Number,
      default: 30,
    },
    seed: {
      type: Number,
      default: 42,
    },
    auto_crop: {
      type: Boolean,
      default: false,
    },
    execution_time_ms: {
      type: Number,
      default: 0,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
)

export default mongoose.model('VirtualTryOn', virtualTryOnSchema)
