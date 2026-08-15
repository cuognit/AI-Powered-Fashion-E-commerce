import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import env from './env.js'

let ioInstance = null

export function createSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  })

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token
      if (token) {
        const payload = jwt.verify(token, env.jwtAccessSecret)
        socket.user = payload
      }
    } catch {
      // Allow unauthenticated connection or invalid token without failing handshake
      socket.user = null
    }
    next()
  })

  io.on('connection', (socket) => {
    const userId = socket.user?.sub
    const userRole = socket.user?.role

    console.log(
      `[Socket.io Backend] Client kết nối thành công: ${socket.id}${
        userId ? ` (User ID: ${userId}, Role: ${userRole})` : ' (Khách vãng lai)'
      }`
    )

    if (userId) {
      const userRoom = `user_${userId}`
      socket.join(userRoom)

      if (userRole === 'admin' || userRole === 'staff') {
        socket.join('role_admin')
      }
    }

    socket.on('join_user_room', (customUserId) => {
      if (customUserId) {
        socket.join(`user_${customUserId}`)
      }
    })

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.io Backend] Client ngắt kết nối: ${socket.id} (Lý do: ${reason})`)
    })
  })

  ioInstance = io
  return io
}

export function getIO() {
  return ioInstance
}

export function emitToUser(userId, event, data) {
  if (!ioInstance || !userId) return
  ioInstance.to(`user_${userId.toString()}`).emit(event, data)
}

export function emitToAdmins(event, data) {
  if (!ioInstance) return
  ioInstance.to('role_admin').emit(event, data)
}

export function emitToAll(event, data) {
  if (!ioInstance) return
  ioInstance.emit(event, data)
}
