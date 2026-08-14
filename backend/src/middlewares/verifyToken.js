import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import env from '../config/env.js'
import User from '../models/User.js'
import { AppError } from '../utils/AppError.js'
import { wasIssuedBeforePasswordChange } from '../utils/passwordChange.js'

export async function verifyToken(request, _response, next) {
  try {
    const authorization = request.headers.authorization
    const [scheme, token] = authorization?.split(' ') || []

    if (scheme !== 'Bearer' || !token) {
      throw new AppError('Bạn chưa đăng nhập', 401)
    }

    const payload = jwt.verify(token, env.jwtAccessSecret)

    if (payload.type !== 'access' || !mongoose.isValidObjectId(payload.sub)) {
      throw new AppError('Token không hợp lệ', 401)
    }

    // Check user in DB to verify status, last password change, and get latest role.
    const user = await User.findById(payload.sub).select('role isActive passwordChangedAt')

    if (!user || wasIssuedBeforePasswordChange(payload.iat, user.passwordChangedAt)) {
      throw new AppError('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', 401)
    }

    if (user.isActive === false) {
      throw new AppError('Tài khoản của bạn đã bị vô hiệu hóa', 401)
    }

    request.user = {
      ...payload,
      role: user.role,
      isActive: user.isActive !== false,
    }
    next()
  } catch (error) {
    next(error instanceof AppError ? error : new AppError('Token không hợp lệ hoặc đã hết hạn', 401))
  }
}
