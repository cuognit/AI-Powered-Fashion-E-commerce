import 'dotenv/config'
import { Client } from '@gradio/client'
import env from '../src/config/env.js'

const CANDIDATES = [
  'yisol/IDM-VTON',
  'levihsu/OOTDiffusion',
  'Nymbo/Virtual-Try-On',
  'Kwai-Kolors/Kolors-Virtual-Try-On',
  'fffiloni/virtual-try-on',
]

async function testSpaces() {
  console.log('🔍 Đang kiểm tra các Space VTON miễn phí khả dụng trên Hugging Face...\n')
  
  const options = {}
  if (env.vton.hfToken) {
    options.token = env.vton.hfToken
  }

  for (const space of CANDIDATES) {
    const start = Date.now()
    try {
      console.log(`⏳ Đang kết nối tới: ${space}...`)
      const client = await Client.connect(space, options)
      const duration = Date.now() - start
      const apiInfo = await client.view_api()
      const endpoints = Object.keys(apiInfo.named_endpoints || {})
      console.log(`  ✅ Thành công (${duration}ms) - Endpoints: [${endpoints.join(', ')}]\n`)
    } catch (err) {
      console.log(`  ❌ Thất bại (${Date.now() - start}ms): ${err.message}\n`)
    }
  }
}

testSpaces()
