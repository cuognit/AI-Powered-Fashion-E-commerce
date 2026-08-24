import 'dotenv/config'
import { Client, handle_file } from '@gradio/client'
import env from '../src/config/env.js'

async function testRealTryOn() {
  console.log('🚀 Bắt đầu test thử đồ thực tế với yisol/IDM-VTON...')
  const options = {}
  if (env.vton.hfToken) options.token = env.vton.hfToken

  const client = await Client.connect('yisol/IDM-VTON', options)
  
  const personUrl = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80'
  const garmentUrl = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'

  console.log('Downloading and preparing files...')
  const pRes = await fetch(personUrl)
  const pBlob = await pRes.blob()
  const gRes = await fetch(garmentUrl)
  const gBlob = await gRes.blob()

  const humanDict = {
    background: handle_file(pBlob),
    layers: [],
    composite: null,
  }

  console.log('Sending predict request...')
  const start = Date.now()
  try {
    const res = await client.predict('/tryon', [
      humanDict,
      handle_file(gBlob),
      'White cotton t-shirt',
      true, // is_checked
      false, // is_checked_crop
      30, // denoise_steps
      42, // seed
    ])
    console.log(`✅ IDM-VTON Thành công trong ${Date.now() - start}ms!`)
    console.log('Kết quả Output Image:', res.data?.[0])
  } catch (err) {
    console.error(`❌ IDM-VTON Lỗi (${Date.now() - start}ms):`, err.message)
  }
}

testRealTryOn()
