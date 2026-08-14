import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { createHash, randomUUID } from 'node:crypto'
import env from '../config/env.js'
import RefreshToken from '../models/RefreshToken.js'
import User from '../models/User.js'
import { AppError } from '../utils/AppError.js'
import {
  MAX_PASSWORD_CHANGES_PER_DAY,
  passwordChangeStatus,
  todayUtcString,
  wasIssuedBeforePasswordChange,
} from '../utils/passwordChange.js'
import {
  clearCredentialFailures,
  credentialLockError,
  lockStatus,
  recordCredentialFailure,
} from '../utils/bruteForce.js'

const PASSWORD_SALT_ROUNDS = 12

function toPublicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive !== false,
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
  const lockKey = `login:${normalizedEmail}`

  const locked = lockStatus(lockKey)
  if (locked) throw credentialLockError(locked.retryAfterMs)

  const user = await User.findOne({ email: normalizedEmail }).select('+password')
  const passwordMatches = user?.password ? await bcrypt.compare(password, user.password) : false

  // A missing account and a wrong password share the same response and both
  // count as a failure, so attackers cannot probe for valid accounts.
  if (!user || !passwordMatches) {
    const blocked = recordCredentialFailure(lockKey)
    if (blocked) throw credentialLockError(blocked.retryAfterMs)
    throw new AppError('Invalid email or password', 401)
  }

  if (user.isActive === false) {
    throw new AppError('Tài khoản của bạn đã bị vô hiệu hóa', 403)
  }

  clearCredentialFailures(lockKey)

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

  const user = await User.findById(payload.sub).select('_id role isActive passwordChangedAt')

  if (!user || user.isActive === false) {
    storedToken.revoked_at = new Date()
    await storedToken.save()
    throw new AppError(user?.isActive === false ? 'Tài khoản của bạn đã bị vô hiệu hóa' : 'Invalid or expired refresh token', 401)
  }

  // Reject refresh tokens issued before the user's last password change.
  if (wasIssuedBeforePasswordChange(payload.iat, user.passwordChangedAt)) {
    storedToken.revoked_at = new Date()
    await storedToken.save()
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

  return {
    user: toPublicUser(user),
    passwordChange: passwordChangeStatus(user),
  }
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
  const lockKey = `pwd:${userId}`

  const locked = lockStatus(lockKey)
  if (locked) throw credentialLockError(locked.retryAfterMs)

  const user = await User.findById(userId).select('+password')

  if (!user) {
    throw new AppError('Không tìm thấy tài khoản', 404)
  }

  const passwordMatches = user.password ? await bcrypt.compare(currentPassword, user.password) : false

  if (!passwordMatches) {
    const blocked = recordCredentialFailure(lockKey)
    if (blocked) throw credentialLockError(blocked.retryAfterMs)
    throw new AppError('Mật khẩu hiện tại không chính xác', 400)
  }

  clearCredentialFailures(lockKey)

  const passwordHash = await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS)
  const todayStr = todayUtcString()
  const lastChangeStr = user.passwordChangedAt ? user.passwordChangedAt.toISOString().slice(0, 10) : null

  if (lastChangeStr !== todayStr) {
    user.passwordChangeCount = 0
  }

  if (user.passwordChangeCount >= MAX_PASSWORD_CHANGES_PER_DAY) {
    throw new AppError(
      `Bạn chỉ được đổi mật khẩu tối đa ${MAX_PASSWORD_CHANGES_PER_DAY} lần mỗi ngày`,
      429,
    )
  }

  user.password = passwordHash
  user.passwordChangedAt = new Date()
  user.passwordChangeCount += 1

  const updated = await user.save()

  // Revoke every existing session (all refresh tokens), including this device's
  // old token, then mint fresh tokens so the current session stays signed in.
  await RefreshToken.updateMany({ user_id: userId, revoked_at: null }, { $set: { revoked_at: new Date() } })

  const tokens = createTokens(updated)
  await saveRefreshToken(userId, tokens.refreshToken)

  return {
    message: 'Đổi mật khẩu thành công',
    user: toPublicUser(updated),
    ...tokens,
    passwordChange: passwordChangeStatus(updated),
  }
}
