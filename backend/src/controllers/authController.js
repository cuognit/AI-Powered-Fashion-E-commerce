import * as authService from '../services/authService.js'

export async function register(request, response, next) {
  try {
    const result = await authService.registerUser(request.body)
    response.status(201).json(result)
  } catch (error) {
    next(error)
  }
}

export async function login(request, response, next) {
  try {
    const { user, accessToken, refreshToken } = await authService.loginUser(request.body)

    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    })

    response.json({
      message: 'Signed in successfully',
      user,
      accessToken,
    })
  } catch (error) {
    next(error)
  }
}

export async function refresh(request, response, next) {
  try {
    const accessToken = await authService.refreshAccessToken(request.cookies?.refreshToken)

    response.json({
      message: 'Access token refreshed successfully',
      accessToken,
    })
  } catch (error) {
    next(error)
  }
}

export async function logout(request, response, next) {
  try {
    await authService.revokeRefreshToken(request.cookies?.refreshToken)

    response.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/api/auth',
    })

    response.status(204).send()
  } catch (error) {
    next(error)
  }
}
