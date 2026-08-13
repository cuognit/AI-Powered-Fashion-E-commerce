import mongoose from 'mongoose'

const valueSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true, lowercase: true },
  color_hex: { type: String, default: null, trim: true },
  is_deleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
}, { timestamps: true })

const attributeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true, lowercase: true },
  display_type: { type: String, enum: ['text', 'color'], default: 'text' },
  values: { type: [valueSchema], default: [] },
  is_deleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true, collection: 'attributes' })

attributeSchema.index({ slug: 1 }, { unique: true })
attributeSchema.index({ is_deleted: 1, name: 1 })

export default mongoose.models.Attribute || mongoose.model('Attribute', attributeSchema)
