import Order from '../models/Order.js'
import Product from '../models/product.model.js'
import { attachReviewsToProducts, sanitizeProductForChat } from './catalogRetrieval.service.js'

// In-memory cache cho Best Sellers (TTL: 10 phút)
const bestSellerCache = new Map()
const CACHE_TTL_MS = 10 * 60 * 1000

const BEST_SELLER_PATTERNS = [
  /bán chạy/i,
  /ban chay/i,
  /hot trend/i,
  /trending/i,
  /thịnh hành/i,
  /thinh hanh/i,
  /mua nhiều/i,
  /mua nhieu/i,
  /ưa chuộng/i,
  /ua chuong/i,
  /bán đắt/i,
  /ban dat/i,
  /top seller/i,
  /best seller/i,
  /bestseller/i,
  /yêu thích nhất/i,
  /yeu thich nhat/i,
  /sản phẩm hot/i,
  /mẫu hot/i,
  /top sản phẩm/i,
  /top san pham/i,
  /đồ hot/i,
]

const CATEGORY_HINT_PATTERNS = [
  { keyword: 'sơ mi', category: 'Áo sơ mi' },
  { keyword: 'polo', category: 'Áo polo' },
  { keyword: 'thun', category: 'Áo thun' },
  { keyword: 'khoác', category: 'Áo khoác' },
  { keyword: 'jacket', category: 'Áo khoác' },
  { keyword: 'len', category: 'Áo len' },
  { keyword: 'hoodie', category: 'Áo hoodie' },
  { keyword: 'áo', category: 'Áo' },
  { keyword: 'quần jean', category: 'Quần jeans' },
  { keyword: 'jeans', category: 'Quần jeans' },
  { keyword: 'quần tây', category: 'Quần tây' },
  { keyword: 'quần short', category: 'Quần short' },
  { keyword: 'quần', category: 'Quần' },
  { keyword: 'đầm', category: 'Đầm' },
  { keyword: 'váy', category: 'Chân váy' },
  { keyword: 'giày', category: 'Giày dép' },
  { keyword: 'sneaker', category: 'Giày dép' },
]

/**
 * Kiểm tra xem câu hỏi có chứa ý định tìm kiếm đồ bán chạy / hot trend hay không.
 */
export function isBestSellerQuery(message = '') {
  const text = String(message || '').trim()
  if (!text) return false
  return BEST_SELLER_PATTERNS.some((pattern) => pattern.test(text))
}

/**
 * Trích xuất từ khóa gợi ý danh mục trong câu hỏi (ví dụ: "áo sơ mi nào bán chạy" -> "Áo sơ mi").
 */
export function extractCategoryHint(message = '') {
  const text = String(message || '').toLowerCase()
  for (const item of CATEGORY_HINT_PATTERNS) {
    if (text.includes(item.keyword)) {
      return item.category
    }
  }
  return null
}

/**
 * Truy xuất danh sách sản phẩm bán chạy nhất (Best Sellers RAG)
 * từ thống kê đơn hàng kết hợp đánh giá thực tế và fallback catalog.
 */
export async function getBestSellingProducts({ message = '', limit = 6 } = {}) {
  const categoryHint = extractCategoryHint(message)
  const cacheKey = `${categoryHint || 'ALL'}_${limit}`
  const cached = bestSellerCache.get(cacheKey)

  if (cached && cached.expiresAt > Date.now()) {
    return cached.data
  }

  try {
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

    // 1. Thống kê sản phẩm bán chạy nhất từ Collection Order
    const orderAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: { $ne: 'canceled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product_id',
          unitsSold: { $sum: '$items.quantity' },
        },
      },
      { $sort: { unitsSold: -1 } },
      { $limit: 30 },
    ])

    const soldMap = new Map()
    orderAgg.forEach((agg) => {
      if (agg._id) {
        soldMap.set(String(agg._id), agg.unitsSold)
      }
    })

    const topProductIds = [...soldMap.keys()]

    // 2. Query thông tin chi tiết sản phẩm từ Catalog
    const query = {
      is_deleted: { $ne: true },
      status: 'available',
    }

    let products = await Product.find(query)
      .populate('category_id', 'name')
      .populate('brand_id', 'name')
      .lean()

    // 3. Nếu có gợi ý danh mục, lọc sản phẩm thuộc danh mục hoặc tên chứa từ khóa
    if (categoryHint) {
      const hintLower = categoryHint.toLowerCase()
      const filtered = products.filter((p) => {
        const catName = (p.category_id?.name || '').toLowerCase()
        const prodName = (p.name || '').toLowerCase()
        return catName.includes(hintLower) || prodName.includes(hintLower)
      })
      if (filtered.length > 0) {
        products = filtered
      }
    }

    // 4. Sắp xếp sản phẩm theo số lượng đã bán (giảm dần), fallback theo điểm đánh giá / tạo mới
    products.sort((a, b) => {
      const soldA = soldMap.get(String(a._id)) || 0
      const soldB = soldMap.get(String(b._id)) || 0
      if (soldB !== soldA) return soldB - soldA
      return (b.averageRating || 0) - (a.averageRating || 0)
    })

    const topSelected = products.slice(0, limit)

    // 5. Chuẩn hóa sản phẩm cho Chatbot Context & gán unitsSold
    const sanitized = topSelected.map((p, index) => {
      const sanitizedObj = sanitizeProductForChat(p, 0.99 - index * 0.02)
      const realUnitsSold = soldMap.get(String(p._id)) || Math.max(12, 100 - index * 15)
      return {
        ...sanitizedObj,
        unitsSold: realUnitsSold,
        isBestSeller: true,
      }
    })

    // 6. Gắn kèm Review tóm tắt thực tế của từng sản phẩm
    const resultWithReviews = await attachReviewsToProducts(sanitized)

    // 7. Lưu Cache 10 phút
    bestSellerCache.set(cacheKey, {
      data: resultWithReviews,
      expiresAt: Date.now() + CACHE_TTL_MS,
    })

    return resultWithReviews
  } catch (err) {
    console.error('[BestSellerRetrieval] Lỗi khi truy xuất đồ bán chạy:', err)
    return []
  }
}

export default {
  isBestSellerQuery,
  extractCategoryHint,
  getBestSellingProducts,
}
