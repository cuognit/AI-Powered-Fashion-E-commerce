import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import env from '../config/env.js'
import User from '../models/User.js'
import { wasIssuedBeforePasswordChange } from '../utils/passwordChange.js'

/**
 * Middleware xác thực Token tùy chọn:
 * - Không có Authorization header -> Cho phép truy cập ẩn danh (Guest: request.user = null)
 * - Có Authorization header nhưng token không hợp lệ / hết hạn -> Trả về 401 để Frontend tự động refresh token
 * - Có token hợp lệ -> Gán request.user
 */
export async function optionalVerifyToken(request, response, next) {
  try {
    const authorization = request.headers.authorization

    // Trường hợp 1: Không có header Authorization -> Guest
    if (!authorization) {
      request.user = null
      return next()
    }

    const [scheme, token] = authorization.split(' ')

    // Trường hợp 2: Có header nhưng sai cấu trúc Bearer
    if (scheme !== 'Bearer' || !token) {
      return response.status(401).json({
        success: false,
        message: 'Định dạng token không hợp lệ',
        code: 'TOKEN_INVALID',
      })
    }

    // Trường hợp 3: Giải mã JWT
    let payload
    try {
      payload = jwt.verify(token, env.jwtAccessSecret)
    } catch (jwtErr) {
      return response.status(401).json({
        success: false,
        message: 'Token đã hết hạn hoặc không hợp lệ',
        code: jwtErr.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID',
      })
    }

    if (payload.type !== 'access' || !mongoose.isValidObjectId(payload.sub)) {
      return response.status(401).json({
        success: false,
        message: 'Loại token không được hỗ trợ',
        code: 'TOKEN_INVALID',
      })
    }

    const user = await User.findById(payload.sub).select('role isActive passwordChangedAt').lean()

    if (!user || user.isActive === false || wasIssuedBeforePasswordChange(payload.iat, user.passwordChangedAt)) {
      return response.status(401).json({
        success: false,
        message: 'Tài khoản không tồn tại, đã bị khóa hoặc đã đổi mật khẩu',
        code: 'ACCOUNT_INVALID',
      })
    }

    request.user = {
      ...payload,
      role: user.role,
      isActive: user.isActive !== false,
    }

    next()
  } catch (error) {
    return response.status(401).json({
      success: false,
      message: error.message || 'Xác thực không thành công',
      code: 'AUTH_FAILED',
    })
  }
}

export default optionalVerifyToken
