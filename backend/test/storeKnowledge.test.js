import test from 'node:test'
import assert from 'node:assert/strict'
import { retrieveStoreKnowledge, STORE_KNOWLEDGE } from '../src/config/storeKnowledge.js'

test('StoreKnowledge: retrieveStoreKnowledge extracts return policy when asked about exchange/returns', () => {
  const result = retrieveStoreKnowledge('Chính sách đổi hàng của shop trong bao nhiêu ngày?')
  assert.ok(result.includes(STORE_KNOWLEDGE.returnPolicy.title))
  assert.ok(result.includes('07 ngày'))
})

test('StoreKnowledge: retrieveStoreKnowledge extracts shipping policy when asked about delivery and fees', () => {
  const result = retrieveStoreKnowledge('Phí ship về tỉnh là bao nhiêu và giao trong bao lâu?')
  assert.ok(result.includes(STORE_KNOWLEDGE.shippingPolicy.title))
  assert.ok(result.includes('500.000 VNĐ'))
})

test('StoreKnowledge: retrieveStoreKnowledge extracts size guide when asked about height and weight', () => {
  const result = retrieveStoreKnowledge('Mình cao 1m72 nặng 68kg thì mặc áo size gì?')
  assert.ok(result.includes(STORE_KNOWLEDGE.sizeGuide.title))
  assert.ok(result.includes('Size L'))
})

test('StoreKnowledge: retrieveStoreKnowledge extracts fabric care when asked about washing/caring for linen/silk', () => {
  const result = retrieveStoreKnowledge('Cách giặt và bảo quản áo lụa đũi không bị co rút?')
  assert.ok(result.includes(STORE_KNOWLEDGE.fabricCareGuide.title))
  assert.ok(result.includes('Linen') || result.includes('Lụa'))
})

test('StoreKnowledge: retrieveStoreKnowledge extracts style guide when asked for outfit matching', () => {
  const result = retrieveStoreKnowledge('Tư vấn cho mình set đồ phối đồ đi làm công sở lịch lãm')
  assert.ok(result.includes(STORE_KNOWLEDGE.styleGuide.title))
  assert.ok(result.includes('Công sở') || result.includes('Smart Casual'))
})

test('StoreKnowledge: returns empty string for unrelated casual phrases', () => {
  const result = retrieveStoreKnowledge('Thời tiết hôm nay thế nào?')
  assert.equal(result, '')
})
