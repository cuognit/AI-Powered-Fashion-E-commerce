import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildProductEmbeddingText,
  calculateContentHash,
} from '../src/services/geminiEmbedding.service.js'

test('GeminiEmbedding: buildProductEmbeddingText serializes full product attributes', () => {
  const sampleProduct = {
    name: 'Áo sơ mi lụa công sở',
    brand: 'Aesthetix Studio',
    category: 'Áo nữ',
    description: 'Chất liệu lụa satin mềm mịn thoáng mát.',
    status: 'available',
    variants: [
      {
        sku: 'SM-PNK-S',
        color: 'Hồng',
        size: 'S',
        option_values: [{ attribute_name: 'Chất liệu', value_name: 'Lụa tơ tằm' }],
      },
      {
        sku: 'SM-PNK-M',
        color: 'Hồng',
        size: 'M',
        option_values: [{ attribute_name: 'Chất liệu', value_name: 'Lụa tơ tằm' }],
      },
    ],
  }

  const text = buildProductEmbeddingText(sampleProduct)
  assert.ok(text.includes('Tên: Áo sơ mi lụa công sở'))
  assert.ok(text.includes('Thương hiệu: Aesthetix Studio'))
  assert.ok(text.includes('Màu sắc: Hồng'))
  assert.ok(text.includes('Kích thước: S, M'))
  assert.ok(text.includes('Thuộc tính: Chất liệu: Lụa tơ tằm'))
  assert.ok(text.includes('Trạng thái: Còn hàng'))
})

test('GeminiEmbedding: calculateContentHash produces stable SHA-256 hash', () => {
  const text1 = 'Tên: Áo khoác chống nắng. Màu sắc: Xanh'
  const text2 = 'Tên: Áo khoác chống nắng. Màu sắc: Xanh'
  const text3 = 'Tên: Áo khoác chống nắng. Màu sắc: Đỏ'

  const hash1 = calculateContentHash(text1)
  const hash2 = calculateContentHash(text2)
  const hash3 = calculateContentHash(text3)

  assert.equal(typeof hash1, 'string')
  assert.equal(hash1.length, 64)
  assert.equal(hash1, hash2)
  assert.notEqual(hash1, hash3)
})
