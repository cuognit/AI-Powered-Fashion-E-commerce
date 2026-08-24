import 'dotenv/config'
import mongoose from 'mongoose'
import env from '../src/config/env.js'
import { connectDatabase } from '../src/config/database.js'
import VirtualTryOn from '../src/models/VirtualTryOn.js'
import vtonService from '../src/services/vton.service.js'

async function runTests() {
  console.log('====================================================')
  console.log('🧪 KIỂM TRA TOÀN DIỆN BACKEND VIRTUAL TRY-ON (VTON)')
  console.log('====================================================\n')

  try {
    // 1. Kết nối DB
    console.log('1️⃣ Kết nối cơ sở dữ liệu MongoDB...')
    await connectDatabase()
    console.log('   ✅ MongoDB đã kết nối thành công!\n')

    // 2. Kiểm tra Mongoose Model VirtualTryOn
    console.log('2️⃣ Kiểm tra Mongoose Model VirtualTryOn...')
    const sampleTask = new VirtualTryOn({
      person_image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f',
      garment_image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518',
      category: 'upper_body',
      description: 'Áo thun cotton trắng cao cấp',
      status: 'pending',
    })
    await sampleTask.save()
    console.log(`   ✅ Tạo thành công bản ghi mẫu Task ID: ${sampleTask._id}`)

    // Cập nhật trạng thái
    sampleTask.status = 'processing'
    await sampleTask.save()
    console.log('   ✅ Cập nhật trạng thái task sang "processing" thành công')

    // Xóa bản ghi test
    await VirtualTryOn.findByIdAndDelete(sampleTask._id)
    console.log('   ✅ Dọn dẹp bản ghi test thành công!\n')

    // 3. Kiểm tra Hugging Face Space Connection qua vtonService
    console.log('3️⃣ Kiểm tra kết nối Gradio Client qua vtonService...')
    const client = await vtonService.getHfClient()
    if (client) {
      console.log('   ✅ vtonService.getHfClient() khởi tạo và lấy client thành công!')
    }

    console.log('\n====================================================')
    console.log('🎉 TẤT CẢ CÁC BƯỚC KIỂM TRA ĐỀU THÀNH CÔNG RỰC RỠ!')
    console.log('====================================================')
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Có lỗi xảy ra trong quá trình kiểm tra:', error)
    process.exit(1)
  }
}

runTests()
