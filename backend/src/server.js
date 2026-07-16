import 'dotenv/config'
import { createServer } from 'node:http'
import app from './app.js'
import env from './config/env.js'
import { connectDatabase } from './config/database.js'
import { createSocketServer } from './config/socket.js'

async function startServer() {
  await connectDatabase()
  const httpServer = createServer(app)
  createSocketServer(httpServer)

  httpServer.listen(env.port, () => {
    console.log(`Backend đang chạy tại http://localhost:${env.port}`)
  })
}

startServer().catch((error) => {
  console.error('Không thể khởi động backend:', error.message)
  process.exit(1)
})
