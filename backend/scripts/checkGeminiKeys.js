import 'dotenv/config'
import { GoogleGenAI } from '@google/genai'
import env from '../src/config/env.js'

async function checkAllKeys() {
  const keys = env.gemini.keys || []
  console.log(`Kiểm tra ${keys.length} API keys trong pool...`)

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const ai = new GoogleGenAI({ apiKey: key })
    try {
      const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
      })
      console.log(`Key ${i + 1} (${key.slice(0, 8)}...): ✅ OK`)
    } catch (err) {
      console.log(`Key ${i + 1} (${key.slice(0, 8)}...): ❌ Lỗi (${err.message})`)
    }
  }
}

checkAllKeys()
