import { io } from 'socket.io-client'

let socket = null

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (
  import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') 
    : 'http://localhost:3000'
)

/**
 * Khởi tạo hoặc kết nối lại Socket.io với Token xác thực
 */
export function connectSocket(token) {
  if (socket && socket.connected) {
    return socket
  }

  if (socket) {
    socket.disconnect()
  }

  socket = io(SOCKET_URL, {
    auth: {
      token: token || undefined,
    },
    transports: ['websocket', 'polling'],
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  })

  socket.on('connect', () => {
    console.log(
      `%c[Socket.io Frontend] Kết nối thành công! Socket ID: ${socket.id}`,
      'color: #10B981; font-weight: bold; background: #ECFDF5; padding: 2px 6px; border-radius: 4px;'
    )
  })

  socket.on('disconnect', (reason) => {
    console.log(
      `%c[Socket.io Frontend] Đã ngắt kết nối: ${reason}`,
      'color: #EF4444; font-weight: bold; background: #FEF2F2; padding: 2px 6px; border-radius: 4px;'
    )
  })

  socket.on('connect_error', (err) => {
    console.warn(`[Socket.io Frontend] Lỗi kết nối Socket: ${err.message}`)
  })

  return socket
}

/**
 * Ngắt kết nối Socket.io khi người dùng đăng xuất
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

/**
 * Lấy đối tượng socket hiện tại
 */
export function getSocket() {
  return socket
}
