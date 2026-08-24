import 'dotenv/config'
import { GoogleGenAI } from '@google/genai'
import env from '../src/config/env.js'

async function testKey2Image() {
  const apiKey = env.gemini.keys?.[1] // Key 2
  console.log(`Dùng Key 2: ${apiKey.slice(0, 8)}...`)
  const ai = new GoogleGenAI({ apiKey })

  try {
    const res = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: 'A stylish young man wearing a modern red jacket and black t-shirt, full body fashion photoshoot, high resolution, 4k',
      config: {
        numberOfImages: 1,
        aspectRatio: '3:4',
        outputMimeType: 'image/jpeg',
      },
    })
    console.log('✅ Imagen 3 Thành công!', res.generatedImages?.length, 'ảnh được sinh.')
  } catch (err) {
    console.log('❌ Lỗi Imagen 3:', err.message)
  }
}

testKey2Image()
