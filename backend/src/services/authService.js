import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { createHash, randomUUID } from 'node:crypto'
import env from '../config/env.js'
import RefreshToken from '../models/RefreshToken.js'
import User from '../models/User.js'
import { AppError } from '../utils/AppError.js'

const PASSWORD_SALT_ROUNDS = 12

function toPublicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || '',
    address: user.address || '',
  }
}

function ensureJwtConfiguration() {
  if (!env.jwtAccessSecret || !env.jwtRefreshSecret) {
    throw new AppError('Authentication service is not configured', 500)
  }
}

function createAccessToken(user) {
  ensureJwtConfiguration()

  return jwt.sign(
    { sub: user._id.toString(), role: user.role, type: 'access' },
    env.jwtAccessSecret,
    { expiresIn: env.jwtAccessExpiresIn },
  )
}

function createRefreshToken(user) {
  ensureJwtConfiguration()

  return jwt.sign(
    { sub: user._id.toString(), type: 'refresh' },
    env.jwtRefreshSecret,
    { expiresIn: env.jwtRefreshExpiresIn, jwtid: randomUUID() },
  )
}

function createTokens(user) {
  return {
    accessToken: createAccessToken(user),
    refreshToken: createRefreshToken(user),
  }
}

function hashRefreshToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

async function saveRefreshToken(userId, token) {
  const payload = jwt.decode(token)

  if (!payload?.exp) {
    throw new AppError('Could not determine refresh token expiration', 500)
  }

  await RefreshToken.create({
    user_id: userId,
    token_hash: hashRefreshToken(token),
    expires_at: new Date(payload.exp * 1000),
  })
}

export async function registerUser({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase()
  const existingUser = await User.exists({ email: normalizedEmail })

  if (existingUser) {
    throw new AppError('An account with this email already exists', 409)
  }

  const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS)

  try {
    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: passwordHash,
    })
    await user.save()

    return {
      message: 'Account created successfully',
      user: toPublicUser(user),
    }
  } catch (error) {
    // The unique index remains the final guard against concurrent requests.
    if (error?.code === 11000) {
      throw new AppError('An account with this email already exists', 409)
    }

    throw error
  }
}

export async function loginUser({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase()
  const user = await User.findOne({ email: normalizedEmail }).select('+password')

  if (!user) {
    throw new AppError('Invalid email or password', 401)
  }

  const passwordMatches = await bcrypt.compare(password, user.password)

  if (!passwordMatches) {
    throw new AppError('Invalid email or password', 401)
  }

  const tokens = createTokens(user)
  await saveRefreshToken(user._id, tokens.refreshToken)

  return {
    user: toPublicUser(user),
    ...tokens,
  }
}

export async function refreshAccessToken(refreshToken) {
  if (!refreshToken) {
    throw new AppError('Refresh token is required', 401)
  }

  ensureJwtConfiguration()

  let payload

  try {
    payload = jwt.verify(refreshToken, env.jwtRefreshSecret)
  } catch {
    throw new AppError('Invalid or expired refresh token', 401)
  }

  if (payload.type !== 'refresh' || !mongoose.isValidObjectId(payload.sub)) {
    throw new AppError('Invalid or expired refresh token', 401)
  }

  const storedToken = await RefreshToken.findOne({
    user_id: payload.sub,
    token_hash: hashRefreshToken(refreshToken),
    revoked_at: null,
    expires_at: { $gt: new Date() },
  })

  if (!storedToken) {
    throw new AppError('Invalid or expired refresh token', 401)
  }

  const user = await User.findById(payload.sub).select('_id role')

  if (!user) {
    throw new AppError('Invalid or expired refresh token', 401)
  }

  storedToken.last_used_at = new Date()
  await storedToken.save()

  return createAccessToken(user)
}

export async function revokeRefreshToken(refreshToken) {
  if (!refreshToken) return

  await RefreshToken.updateOne(
    {
      token_hash: hashRefreshToken(refreshToken),
      revoked_at: null,
    },
    {
      $set: { revoked_at: new Date() },
    },
  )
}

export async function getUserProfile(userId) {
  const user = await User.findById(userId)

  if (!user) {
    throw new AppError('Không tìm thấy tài khoản', 404)
  }

  return { user: toPublicUser(user) }
}

export async function updateUserProfile(userId, { name, phone, address }) {
  const user = await User.findById(userId)

  if (!user) {
    throw new AppError('Không tìm thấy tài khoản', 404)
  }

  if (name != null) user.name = name.trim()
  if (phone != null) user.phone = phone.trim()
  if (address != null) user.address = address.trim()

  await user.save()

  return { user: toPublicUser(user) }
}

export async function changeUserPassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select('+password')

  if (!user) {
    throw new AppError('Không tìm thấy tài khoản', 404)
  }

  const passwordMatches = await bcrypt.compare(currentPassword, user.password)

  if (!passwordMatches) {
    throw new AppError('Mật khẩu hiện tại không chính xác', 400)
  }

  user.password = await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS)
  await user.save()

  return { message: 'Đổi mật khẩu thành công' }
}
