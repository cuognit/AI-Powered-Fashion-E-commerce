import test from 'node:test'
import assert from 'node:assert/strict'
import { attachStatsToProducts, attachStatsToSingleProduct } from '../src/services/productStats.service.js'

test('ProductStats: handles empty or invalid inputs gracefully', async () => {
  assert.deepEqual(await attachStatsToProducts([]), [])
  assert.equal(await attachStatsToProducts(null), null)
  assert.equal(await attachStatsToSingleProduct(null), null)
})

test('ProductStats: preserves existing product properties and fallback defaults', async () => {
  const dummyProduct = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Áo sơ mi lụa Aesthetix',
    base_price: 350000,
    sold_count: 15,
    average_rating: 4.8,
    reviews_count: 6,
  }

  const [enriched] = await attachStatsToProducts([dummyProduct])
  assert.equal(enriched.name, 'Áo sơ mi lụa Aesthetix')
  assert.equal(enriched.base_price, 350000)
  assert.equal(enriched.sold_count, 15)
  assert.equal(enriched.average_rating, 4.8)
  assert.equal(enriched.reviews_count, 6)
})

test('ProductStats: attachStatsToSingleProduct enriches a single product object', async () => {
  const dummy = {
    _id: '507f1f77bcf86cd799439012',
    name: 'Quần Jeans Slimfit',
    sold_count: 24,
    rating: 4.9,
  }

  const enriched = await attachStatsToSingleProduct(dummy)
  assert.equal(enriched._id, '507f1f77bcf86cd799439012')
  assert.equal(enriched.sold_count, 24)
  assert.equal(enriched.rating, 4.9)
})
