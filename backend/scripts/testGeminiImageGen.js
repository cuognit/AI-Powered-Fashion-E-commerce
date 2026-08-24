import 'dotenv/config'
import { GoogleGenAI } from '@google/genai'
import env from '../src/config/env.js'

async function testGeminiImage() {
  const apiKey = env.gemini.keys?.[0]
  if (!apiKey) {
    console.error('Không tìm thấy Gemini API Key trong env')
    return
  }

  const ai = new GoogleGenAI({ apiKey })

  console.log('1️⃣ Thử nghiệm Imagen 3 (imagen-3.0-generate-002)...')
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: 'A professional fashion model wearing a white modern t-shirt, studio lighting, photorealistic, 8k',
      config: {
        numberOfImages: 1,
        aspectRatio: '3:4',
        outputMimeType: 'image/jpeg',
      },
    })

    if (response.generatedImages?.[0]?.image?.imageBytes) {
      console.log('✅ Imagen 3 hoạt động thành công! Kích thước bytes:', response.generatedImages[0].image.imageBytes.length)
    } else {
      console.log('Phản hồi Imagen 3:', response)
    }
  } catch (err) {
    console.log('❌ Imagen 3 không khả dụng:', err.message)
  }
}

testGeminiImage()
