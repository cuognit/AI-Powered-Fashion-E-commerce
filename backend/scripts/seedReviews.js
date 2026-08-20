import 'dotenv/config'
import dns from 'node:dns'
import mongoose from 'mongoose'
import { connectDatabase } from '../src/config/database.js'
import Product from '../src/models/product.model.js'
import User from '../src/models/User.js'
import Review from '../src/models/review.model.js'

dns.setServers(['8.8.8.8', '1.1.1.1'])

const SAMPLE_REVIEWS_TEMPLATES = [
  {
    rating: 5,
    content: 'Áo chất vải đũi/cotton mặc rất mát và nhẹ, thấm hút mồ hôi tốt. Đường may tỉ mỉ, không có chỉ thừa. Form áo lên dáng chuẩn như mẫu.',
  },
  {
    rating: 5,
    content: 'Màu sắc thực tế bên ngoài rất đẹp và sang, giống hệt ảnh shop đăng. Mình cao 1m70 nặng 65kg mặc size L vừa vặn thoải mái.',
  },
  {
    rating: 4,
    content: 'Chất vải đẹp, sờ mịn tay. Form áo hơi ôm nhẹ (Slim fit) nên bạn nào thích mặc rộng rãi nên tăng lên 1 size nhé. Đóng gói cẩn thận, giao nhanh.',
  },
  {
    rating: 5,
    content: 'Quần form đứng dáng, chất vải co giãn nhẹ mặc rất dễ chịu cả ngày đi làm. Giặt máy không bị phai màu hay xù lông. Sẽ tiếp tục ủng hộ shop!',
  },
  {
    rating: 4,
    content: 'Sản phẩm hoàn thiện tốt so với tầm giá. Vải mềm mịn, giặt lần đầu nước lạnh không bị co rút. Khuyên mọi người nên chọn đúng bảng size của shop.',
  },
  {
    rating: 5,
    content: 'Đầm/váy dáng đẹp xuất sắc, chất lụa/voan rủ mềm tôn dáng lắm. Mặc đi tiệc ai cũng khen. 10/10 điểm cho chất lượng và độ tư vấn nhiệt tình.',
  },
]

async function seedReviews() {
  console.log('[SeedReviews] Bắt đầu kết nối MongoDB...')
  await connectDatabase()

  try {
    const products = await Product.find({ is_deleted: false, status: 'available' }).limit(30).lean()
    let users = await User.find({ isActive: { $ne: false } }).limit(10).lean()

    if (!products.length) {
      console.log('[SeedReviews] Không tìm thấy sản phẩm khả dụng nào.')
      return
    }

    if (!users.length) {
      console.log('[SeedReviews] Tạo người dùng mẫu...')
      const dummyUser = await User.create({
        name: 'Nguyễn Văn An',
        email: 'an.nguyen.customer@example.com',
        password: '$2a$10$dummyhashedpasswordforreviewseed0000000000000000',
        role: 'customer',
        isActive: true,
      })
      users = [dummyUser]
    }

    let createdCount = 0

    for (let i = 0; i < products.length; i += 1) {
      const product = products[i]
      const variants = product.variants || []
      if (!variants.length) continue

      // Tạo từ 2 đến 4 review cho mỗi sản phẩm
      const reviewsPerProduct = 2 + (i % 3)

      for (let j = 0; j < reviewsPerProduct; j += 1) {
        const user = users[(i + j) % users.length]
        const variant = variants[j % variants.length]
        const template = SAMPLE_REVIEWS_TEMPLATES[(i + j) % SAMPLE_REVIEWS_TEMPLATES.length]

        const existing = await Review.findOne({
          userId: user._id,
          productId: product._id,
          variantSku: variant.sku,
        })

        if (!existing) {
          await Review.create({
            userId: user._id,
            productId: product._id,
            variantSku: variant.sku,
            color: variant.color || 'Tiêu chuẩn',
            size: variant.size || 'M',
            rating: template.rating,
            content: template.content,
            selectedOptions: variant.option_values || [],
          })
          createdCount += 1
        }
      }
    }

    const totalReviews = await Review.countDocuments()
    console.log(`[SeedReviews] Đã tạo thành công ${createdCount} reviews mới. Tổng số reviews trong DB: ${totalReviews}.`)
  } catch (err) {
    console.error('[SeedReviews] Lỗi khi seed reviews:', err)
  } finally {
    await mongoose.disconnect()
    console.log('[SeedReviews] Đã ngắt kết nối DB.')
  }
}

seedReviews()
