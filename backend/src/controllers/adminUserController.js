import * as adminUserService from '../services/adminUserService.js'

export async function getUsers(request, response, next) {
  try {
    response.json(await adminUserService.listUsers(request.query))
  } catch (error) {
    next(error)
  }
}

export async function getUser(request, response, next) {
  try {
    response.json(await adminUserService.getUser(request.params.userId))
  } catch (error) {
    next(error)
  }
}

export async function getUserOrders(request, response, next) {
  try {
    response.json(await adminUserService.getUserOrders(request.params.userId, request.query))
  } catch (error) {
    next(error)
  }
}

export async function updateUser(request, response, next) {
  try {
    const adminUserId = request.user?.sub || request.user?.id
    response.json(await adminUserService.updateUser(adminUserId, request.params.userId, request.body))
  } catch (error) {
    next(error)
  }
}
