import 'dotenv/config'
import { Client, handle_file } from '@gradio/client'
import env from '../src/config/env.js'

async function testOotdHdQuality() {
  console.log('🚀 Đang kiểm tra render OOTDiffusion HD với thông số chất lượng cao...')
  const options = {}
  if (env.vton.hfToken) options.token = env.vton.hfToken

  const client = await Client.connect('levihsu/OOTDiffusion', options)

  const personUrl = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=768&h=1024&q=80'
  const garmentUrl = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=768&h=1024&q=80'

  console.log('Tải ảnh mẫu...')
  const [pBlob, gBlob] = await Promise.all([
    fetch(personUrl).then((r) => r.blob()),
    fetch(garmentUrl).then((r) => r.blob()),
  ])

  console.log('Gửi predict tới endpoint /process_hd (High-Definition 768x1024)...')
  const start = Date.now()
  try {
    const res = await client.predict('/process_hd', [
      handle_file(pBlob),
      handle_file(gBlob),
      1, // n_samples
      35, // n_steps (tăng từ 20 lên 35 để nét tối đa)
      2.5, // image_scale (tăng lên 2.5 để bám sát trang phục)
      42, // seed
    ])
    console.log(`✅ Hoàn thành trong ${Date.now() - start}ms!`)
    console.log('Kết quả HD:', JSON.stringify(res.data?.[0], null, 2))
  } catch (err) {
    console.error('❌ Lỗi:', err.message)
  }
}

testOotdHdQuality()
