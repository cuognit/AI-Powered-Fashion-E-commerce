import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'categories', required: true },
    brand: { type: String, required: true },
    description: { type: String, default: '' },
    base_price: { type: Number, required: true, min: 0 },
    sale_price: { type: Number, default: null },
    images: [{ type: String }],
    variants: [
      {
        sku: { type: String, required: true },
        color: { type: String, required: true },
        size: { type: String, required: true },
        stock: { type: Number, required: true, min: 0 }
      }
    ],
    status: { type: String, enum: ['available', 'hidden', 'out_of_stock'], default: 'available' },
    is_deleted: { type: Boolean, default: false, index: true },
    embedding_vector: { type: [Number], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model('Product', productSchema);
