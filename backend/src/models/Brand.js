import mongoose from 'mongoose'

const brandSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true, lowercase: true },
  description: { type: String, trim: true, default: '' },
  is_system: { type: Boolean, default: false },
  is_deleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true, collection: 'brands' })

brandSchema.index({ slug: 1 }, { unique: true })
brandSchema.index({ is_deleted: 1, name: 1 })

export default mongoose.models.Brand || mongoose.model('Brand', brandSchema)
