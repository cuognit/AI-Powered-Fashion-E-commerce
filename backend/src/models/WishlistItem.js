import mongoose from 'mongoose'

const wishlistItemSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
}, { timestamps: true, collection: 'wishlist_items' })

wishlistItemSchema.index({ user_id: 1, product_id: 1 }, { unique: true })

export default mongoose.model('WishlistItem', wishlistItemSchema)
