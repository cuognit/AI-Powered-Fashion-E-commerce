import 'dotenv/config'
import { Client } from '@gradio/client'

async function inspectOotd() {
  const client = await Client.connect('levihsu/OOTDiffusion')
  const api = await client.view_api()
  console.log('--- OOTDiffusion API ---')
  console.log(JSON.stringify(api, null, 2))
}

inspectOotd()
