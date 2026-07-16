import jwt from 'jsonwebtoken'
import env from '../config/env.js'
import { AppError } from '../utils/AppError.js'

export function verifyToken(request, _response, next) {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '')
    if (!token) throw new AppError('Bạn chưa đăng nhập', 401)

    request.user = jwt.verify(token, env.jwtSecret)
    next()
  } catch (error) {
    next(error instanceof AppError ? error : new AppError('Token không hợp lệ', 401))
  }
}
