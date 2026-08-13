import Product from '../models/product.model.js'

export async function findProducts() {
  return Product.find({
    is_deleted: false,
    status: 'available',
  }).lean()
}
