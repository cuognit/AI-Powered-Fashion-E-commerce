import 'dotenv/config'
import { createServer } from 'node:http'
import app from './app.js'
import env from './config/env.js'
import { connectDatabase } from './config/database.js'
import { createSocketServer } from './config/socket.js'
import dns from 'node:dns';
import { expirePendingPayments, reconcilePendingPayments } from './services/checkoutService.js'

async function startServer() {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
  await connectDatabase()
  const httpServer = createServer(app)
  createSocketServer(httpServer)

  const expirationTimer = setInterval(async () => {
    try {
      await expirePendingPayments()
      await reconcilePendingPayments()
    } catch (error) { console.error('Payment reconciliation job failed:', error.message) }
  }, 60_000)
  expirationTimer.unref()

  httpServer.listen(env.port, () => {
    console.log(`Backend đang chạy tại http://localhost:${env.port}`)
  })
}

startServer().catch((error) => {
  console.error('Không thể khởi động backend:', error.message)
  process.exit(1)
})
