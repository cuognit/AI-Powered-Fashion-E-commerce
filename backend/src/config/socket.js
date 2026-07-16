import { Server } from 'socket.io'

export function createSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  })

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`)
    socket.on('disconnect', () => console.log(`Socket disconnected: ${socket.id}`))
  })

  return io
}
