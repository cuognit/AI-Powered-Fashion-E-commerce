import Product from '../models/Product.js'

export async function findProducts() {
  return Product.find({
    is_deleted: false,
    status: 'available',
  }).lean()
}
