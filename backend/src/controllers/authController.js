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
    const result = await authService.loginUser(request.body)
    response.json(result)
  } catch (error) {
    next(error)
  }
}
