import 'dotenv/config'
import { Client } from '@gradio/client'
import env from '../src/config/env.js'

async function testHfConnection() {
  console.log('====================================================')
  console.log('🚀 Bắt đầu kiểm tra kết nối Hugging Face Space VTON')
  console.log(`📌 Space ID: ${env.vton.spaceId}`)
  console.log(`🔑 HF Token: ${env.vton.hfToken ? 'Đã cấu hình (ẩn vì bảo mật)' : 'Chưa cấu hình (dùng Public Space)'}`)
  console.log('====================================================\n')

  try {
    const options = {}
    if (env.vton.hfToken) {
      options.token = env.vton.hfToken
      options.hf_token = env.vton.hfToken
    }

    console.log('⏳ Đang khởi tạo kết nối qua @gradio/client...')
    const startTime = Date.now()
    const client = await Client.connect(env.vton.spaceId, options)
    const connectTime = Date.now() - startTime

    console.log(`✅ Kết nối thành công tới Space '${env.vton.spaceId}' trong ${connectTime}ms!\n`)

    console.log('🔍 Đang kiểm tra schema endpoints (view_api)...')
    const apiInfo = await client.view_api()

    console.log('--- Chi tiết endpoint /tryon ---')
    if (apiInfo?.named_endpoints?.['/tryon']) {
      console.log(JSON.stringify(apiInfo.named_endpoints['/tryon'], null, 2))
    }

    console.log('\n====================================================')
    console.log('🎉 KIỂM TRA KẾT NỐI THÀNH CÔNG RỰC RỠ!')
    console.log('====================================================')
  } catch (error) {
    console.error('\n❌ Thất bại khi kết nối tới Hugging Face Space:')
    console.error(`- Tên lỗi: ${error.name}`)
    console.error(`- Thông điệp: ${error.message}`)
    if (error.stack) {
      console.error(`- Stack: ${error.stack}`)
    }
    process.exit(1)
  }
}

testHfConnection()
