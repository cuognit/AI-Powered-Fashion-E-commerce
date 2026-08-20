import test from 'node:test'
import assert from 'node:assert/strict'
import {
  extractCategoryHint,
  isBestSellerQuery,
} from '../src/services/bestSellerRetrieval.service.js'

test('BestSellerRetrieval: isBestSellerQuery accurately detects best seller and trending intents', () => {
  assert.equal(isBestSellerQuery('Shop có mẫu nào bán chạy nhất hiện nay?'), true)
  assert.equal(isBestSellerQuery('Gợi ý cho mình đồ hot trend mùa này với'), true)
  assert.equal(isBestSellerQuery('Những sản phẩm nào đang được mua nhiều nhất?'), true)
  assert.equal(isBestSellerQuery('Cho xem danh sách best seller của cửa hàng'), true)
  assert.equal(isBestSellerQuery('Mẫu áo thun nào đang thịnh hành nhất?'), true)
  assert.equal(isBestSellerQuery('Đầm nào được ưa chuộng nhất?'), true)

  assert.equal(isBestSellerQuery('Xin chào bạn'), false)
  assert.equal(isBestSellerQuery('Cảm ơn shop nhiều nhé'), false)
  assert.equal(isBestSellerQuery('Chính sách đổi trả của shop thế nào?'), false)
  assert.equal(isBestSellerQuery('Phí ship về Hải Phòng bao nhiêu?'), false)
  assert.equal(isBestSellerQuery('Mình cao 1m70 nặng 65kg mặc size gì?'), false)
})

test('BestSellerRetrieval: extractCategoryHint extracts matching category hints from questions', () => {
  assert.equal(extractCategoryHint('Áo sơ mi nào đang bán chạy nhất?'), 'Áo sơ mi')
  assert.equal(extractCategoryHint('Tư vấn giúp em mẫu đầm hot trend đi tiệc'), 'Đầm')
  assert.equal(extractCategoryHint('Quần jean nào được mua nhiều nhất?'), 'Quần jeans')
  assert.equal(extractCategoryHint('Áo polo nào đang thịnh hành?'), 'Áo polo')
  assert.equal(extractCategoryHint('Áo khoác gió nào bán chạy?'), 'Áo khoác')
  assert.equal(extractCategoryHint('Top đồ bán chạy nhất cửa hàng?'), null)
})
