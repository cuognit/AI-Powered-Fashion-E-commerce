import 'dotenv/config'
import { Client } from '@gradio/client'
import env from '../src/config/env.js'

const IDM_MIRRORS = [
  'yisol/IDM-VTON',
  'Wild-Heart/IDM-VTON',
  'zero-gpu-explorers/IDM-VTON',
  'Kwai-Kolors/Kolors-Virtual-Try-On',
]

async function testMirrors() {
  const options = {}
  if (env.vton.hfToken) options.token = env.vton.hfToken

  for (const space of IDM_MIRRORS) {
    try {
      console.log(`Checking ${space}...`)
      const client = await Client.connect(space, options)
      const api = await client.view_api()
      console.log(`✅ ${space} - OK! Endpoints:`, Object.keys(api.named_endpoints || {}))
    } catch (err) {
      console.log(`❌ ${space} - Lỗi:`, err.message)
    }
  }
}

testMirrors()
