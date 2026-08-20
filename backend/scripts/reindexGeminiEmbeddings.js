import 'dotenv/config'
import mongoose from 'mongoose'
import '../src/models/Category.js'
import '../src/models/Brand.js'
import Product from '../src/models/product.model.js'
import {
  buildProductEmbeddingText,
  calculateContentHash,
  embedProductDocument,
} from '../src/services/geminiEmbedding.service.js'
import geminiKeyPool from '../src/services/geminiKeyPool.js'


const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fashion_db'
const isForce = process.argv.includes('--force') || process.argv.includes('--all')
const BATCH_SIZE = 5

async function runReindex() {
  console.log('====================================================')
  console.log('🔄 BẮT ĐẦU MIGRATION GEMINI EMBEDDING CHO CATALOG')
  console.log('====================================================')

  try {
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Đã kết nối MongoDB thành công.')

    const poolStatus = geminiKeyPool.getPoolStatus()
    console.log(`🔑 Cấu hình Gemini Key Pool: ${poolStatus.length} keys`)
    poolStatus.forEach((k) => console.log(`   - Key #${k.index}: ${k.maskedKey} (disabled: ${k.disabled})`))

    const filter = { is_deleted: false }
    if (!isForce) {
      filter.$or = [
        { gemini_embedding_vector: { $exists: false } },
        { gemini_embedding_vector: { $size: 0 } },
        { embedding_status: { $ne: 'ready' } },
      ]
    }

    const totalProducts = await Product.countDocuments({ is_deleted: false })
    const productsToProcess = await Product.find(filter)
      .populate('category_id', 'name slug')
      .populate('brand_id', 'name slug')

    console.log(`\n📦 Tổng số sản phẩm trong cơ sở dữ liệu: ${totalProducts}`)
    console.log(`🎯 Số sản phẩm cần sinh Gemini Embedding: ${productsToProcess.length}`)

    if (productsToProcess.length === 0) {
      console.log('✨ Tất cả sản phẩm đã có Gemini embedding 768 chiều hoàn chỉnh!')
      await mongoose.disconnect()
      return
    }

    let successCount = 0
    let failureCount = 0

    for (let i = 0; i < productsToProcess.length; i += BATCH_SIZE) {
      const batch = productsToProcess.slice(i, i + BATCH_SIZE)
      console.log(`\n⚙️ Đang xử lý nhóm sản phẩm ${i + 1} - ${Math.min(i + BATCH_SIZE, productsToProcess.length)} / ${productsToProcess.length}...`)

      await Promise.all(
        batch.map(async (product) => {
          try {
            const text = buildProductEmbeddingText(product)
            const hash = calculateContentHash(text)

            const vector = await embedProductDocument(text)

            if (Array.isArray(vector) && vector.length === 768) {
              product.gemini_embedding_vector = vector
              product.embedding_model = 'gemini-embedding-2'
              product.embedding_dimension = 768
              product.embedding_status = 'ready'
              product.embedding_updated_at = new Date()
              product.embedding_content_hash = hash
              await product.save()
              successCount += 1
              console.log(`  ✅ [${product._id}] "${product.name.slice(0, 30)}..." -> 768 vector OK`)
            } else {
              product.embedding_status = 'failed'
              await product.save()
              failureCount += 1
              console.warn(`  ⚠️ [${product._id}] "${product.name.slice(0, 30)}..." -> Vector không hợp lệ`)
            }
          } catch (err) {
            failureCount += 1
            product.embedding_status = 'failed'
            try {
              await product.save()
            } catch {
              // Ignore
            }
            console.error(`  ❌ [${product._id}] "${product.name.slice(0, 30)}..." -> Lỗi: ${err.message}`)
          }
        }),
      )
    }

    const readyCount = await Product.countDocuments({ is_deleted: false, embedding_status: 'ready' })
    const pendingCount = await Product.countDocuments({ is_deleted: false, embedding_status: { $ne: 'ready' } })

    console.log('\n====================================================')
    console.log('📊 BÁO CÁO TỔNG KẾT RE-INDEX GEMINI EMBEDDINGS')
    console.log('====================================================')
    console.log(`- Tổng số sản phẩm cần xử lý: ${productsToProcess.length}`)
    console.log(`- Thành công đợt này:        ${successCount}`)
    console.log(`- Thất bại đợt này:          ${failureCount}`)
    console.log(`- Toàn bộ sản phẩm Ready:    ${readyCount} / ${totalProducts} (${((readyCount / (totalProducts || 1)) * 100).toFixed(1)}%)`)
    console.log(`- Còn Pending/Failed:        ${pendingCount}`)
    console.log('====================================================\n')
  } catch (error) {
    console.error('🔥 Lỗi nghiêm trọng khi chạy re-index script:', error)
    process.exitCode = 1
  } finally {
    await mongoose.disconnect()
    console.log('🔌 Đã đóng kết nối database.')
  }
}

runReindex()
