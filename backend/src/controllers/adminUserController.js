import * as adminUserService from '../services/adminUserService.js'

export async function getUsers(request, response, next) {
  try { response.json(await adminUserService.listCustomers(request.query)) }
  catch (error) { next(error) }
}

export async function getUser(request, response, next) {
  try { response.json(await adminUserService.getCustomer(request.params.userId)) }
  catch (error) { next(error) }
}

export async function getUserOrders(request, response, next) {
  try { response.json(await adminUserService.getCustomerOrders(request.params.userId, request.query)) }
  catch (error) { next(error) }
}
