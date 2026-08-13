import assert from 'node:assert/strict'
import test from 'node:test'
import { addWishlistItem, getWishlist, removeWishlistItem } from '../src/controllers/wishlistController.js'
import WishlistItem from '../src/models/WishlistItem.js'
import Product from '../src/models/product.model.js'
import wishlistRoutes from '../src/routes/wishlist.routes.js'

const USER_A = '64b000000000000000000001'
const USER_B = '64b000000000000000000002'
const PRODUCT_ID = '64b000000000000000000010'

const response = () => ({ statusCode: 200, payload: null, status(code) { this.statusCode = code; return this }, json(value) { this.payload = value; return this } })
const nextCapture = () => { const errors = []; return { errors, next: (error) => errors.push(error) } }

test('wishlist routes apply authentication before all handlers', () => {
  const layers = wishlistRoutes.stack
  assert.equal(layers[0].name, 'verifyToken')
  assert.deepEqual(layers.slice(1).map((layer) => Object.keys(layer.route.methods)[0]), ['get', 'post', 'delete'])
})

test('add is an upsert, validates visible product and stays scoped to the user', async () => {
  const originalFindOne = Product.findOne
  const originalUpsert = WishlistItem.findOneAndUpdate
  let productFilter
  let upsertFilter
  let upsertOptions
  Product.findOne = (filter) => { productFilter = filter; return { select: () => ({ lean: async () => ({ _id: PRODUCT_ID, status: 'out_of_stock', variants: [] }) }) } }
  WishlistItem.findOneAndUpdate = (filter, _update, options) => { upsertFilter = filter; upsertOptions = options; return { lean: async () => ({ createdAt: new Date('2026-08-13') }) } }
  try {
    const res = response(); const capture = nextCapture()
    await addWishlistItem({ user: { sub: USER_A }, body: { productId: PRODUCT_ID } }, res, capture.next)
    assert.equal(capture.errors.length, 0)
    assert.deepEqual(productFilter, { _id: PRODUCT_ID, is_deleted: false, status: { $ne: 'hidden' } })
    assert.deepEqual(upsertFilter, { user_id: USER_A, product_id: PRODUCT_ID })
    assert.equal(upsertOptions.upsert, true)
    assert.equal(res.payload.item.status, 'out_of_stock')
  } finally { Product.findOne = originalFindOne; WishlistItem.findOneAndUpdate = originalUpsert }
})

test('add rejects malformed ids and missing/hidden/deleted products', async () => {
  const bad = nextCapture()
  await addWishlistItem({ user: { sub: USER_A }, body: { productId: 'bad-id' } }, response(), bad.next)
  assert.equal(bad.errors[0].statusCode, 400)

  const originalFindOne = Product.findOne
  Product.findOne = () => ({ select: () => ({ lean: async () => null }) })
  try {
    const missing = nextCapture()
    await addWishlistItem({ user: { sub: USER_A }, body: { productId: PRODUCT_ID } }, response(), missing.next)
    assert.equal(missing.errors[0].statusCode, 404)
  } finally { Product.findOne = originalFindOne }
})

test('get returns newest visible populated products and uses the current account only', async () => {
  const originalFind = WishlistItem.find
  let queriedUser
  WishlistItem.find = (filter) => {
    queriedUser = filter.user_id
    return { sort: (sort) => { assert.deepEqual(sort, { createdAt: -1 }); return { populate: () => ({ lean: async () => [
      { product_id: { _id: PRODUCT_ID, status: 'out_of_stock' }, createdAt: new Date('2026-08-13') },
      { product_id: null, createdAt: new Date('2026-08-12') },
    ] }) } } }
  }
  try {
    const res = response(); const capture = nextCapture()
    await getWishlist({ user: { sub: USER_B } }, res, capture.next)
    assert.equal(queriedUser, USER_B)
    assert.equal(res.payload.count, 1)
    assert.equal(res.payload.items[0].status, 'out_of_stock')
    assert.ok(res.payload.items[0].favoritedAt)
  } finally { WishlistItem.find = originalFind }
})

test('delete is idempotent and scoped to product plus current account', async () => {
  const originalDeleteOne = WishlistItem.deleteOne
  const filters = []
  WishlistItem.deleteOne = async (filter) => { filters.push(filter); return { deletedCount: filters.length === 1 ? 1 : 0 } }
  try {
    for (let index = 0; index < 2; index += 1) {
      const res = response(); const capture = nextCapture()
      await removeWishlistItem({ user: { sub: USER_A }, params: { productId: PRODUCT_ID } }, res, capture.next)
      assert.equal(res.payload.success, true)
    }
    assert.deepEqual(filters[0], { user_id: USER_A, product_id: PRODUCT_ID })
    assert.deepEqual(filters[1], filters[0])
  } finally { WishlistItem.deleteOne = originalDeleteOne }
})
