import test from 'node:test'
import assert from 'node:assert/strict'
import {
  attachReviewsToProducts,
  calculateCosineSimilarity,
  calculateLexicalScore,
  isProductQuery,
  sanitizeProductForChat,
} from '../src/services/catalogRetrieval.service.js'

test('CatalogRetrieval: isProductQuery detects fashion search intent vs greetings/general questions', () => {
  assert.equal(isProductQuery('Xin chào shop'), false)
  assert.equal(isProductQuery('Cảm ơn bạn nhé'), false)
  assert.equal(isProductQuery('Shop ở đâu vậy?'), false)
  assert.equal(isProductQuery('Tìm áo sơ mi trắng công sở'), true)
  assert.equal(isProductQuery('Tư vấn giúp em mẫu đầm đi biển'), true)
  assert.equal(isProductQuery('Giày sneaker nam giá dưới 1 triệu'), true)
})

test('CatalogRetrieval: calculateCosineSimilarity computes exact vector similarity', () => {
  const vecA = [1, 0, 0]
  const vecB = [1, 0, 0]
  const vecC = [0, 1, 0]

  assert.equal(Math.round(calculateCosineSimilarity(vecA, vecB)), 1)
  assert.equal(Math.round(calculateCosineSimilarity(vecA, vecC)), 0)
})

test('CatalogRetrieval: calculateLexicalScore matches exact phrases and token overlap', () => {
  const product = {
    name: 'Áo khoác chống nắng nữ UPF 50+',
    brand: 'Urban Wear',
    category: 'Áo khoác',
    description: 'Chất liệu thun lạnh AIRism cản tia UV thoáng mát.',
  }

  const scoreExact = calculateLexicalScore(product, 'Áo khoác chống nắng')
  const scorePartial = calculateLexicalScore(product, 'Áo khoác gió mùa đông')
  const scoreNone = calculateLexicalScore(product, 'Giày thể thao sneaker')

  assert.ok(scoreExact > scorePartial)
  assert.ok(scorePartial > scoreNone)
  assert.equal(scoreNone, 0)
})

test('CatalogRetrieval: sanitizeProductForChat formats product context and calculates price ranges', () => {
  const rawProduct = {
    _id: '665001122334455667788990',
    name: 'Áo Polo Nam Classic',
    brand: 'Denim Co',
    base_price: 350000,
    sale_price: 299000,
    total_stock: 45,
    status: 'available',
    description: 'Áo polo cotton cao cấp.',
    images: ['https://example.com/polo.jpg'],
    variants: [
      { sku: 'POLO-BLU-M', color: 'Xanh', size: 'M', stock: 20, sale_price: 299000 },
      { sku: 'POLO-BLU-L', color: 'Xanh', size: 'L', stock: 25, sale_price: 299000 },
    ],
  }

  const sanitized = sanitizeProductForChat(rawProduct, 0.95)

  assert.equal(sanitized.id, '665001122334455667788990')
  assert.equal(sanitized.name, 'Áo Polo Nam Classic')
  assert.equal(sanitized.availability, 'Còn hàng')
  assert.equal(sanitized.minPrice, 299000)
  assert.equal(sanitized.score, 0.95)
  assert.equal(sanitized.productUrl, '/products/665001122334455667788990')
})

test('CatalogRetrieval: attachReviewsToProducts safely handles empty or non-array inputs', async () => {
  const emptyRes = await attachReviewsToProducts([])
  assert.deepEqual(emptyRes, [])
  const nullRes = await attachReviewsToProducts(null)
  assert.equal(nullRes, null)
})

