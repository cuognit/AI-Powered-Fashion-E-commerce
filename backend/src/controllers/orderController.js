import * as checkoutService from '../services/checkoutService.js'
import * as orderService from '../services/orderService.js'

export async function getOrders(request, response, next) {
  try { response.json(await orderService.listOrdersForUser(request.user.sub, request.query)) }
  catch (error) { next(error) }
}

export async function createCodOrder(request, response, next) {
  try { response.status(201).json(await checkoutService.createCodOrder(request.user.sub, request.body, request.ip)) }
  catch (error) { next(error) }
}

export async function getOrder(request, response, next) {
  try { response.json(await orderService.getOrderForUser(request.params.orderCode, request.user)) }
  catch (error) { next(error) }
}

export async function cancelOrder(request, response, next) {
  try { response.json(await orderService.cancelOrder(request.user.sub, request.params.orderCode, request.body)) }
  catch (error) { next(error) }
}

export async function reorder(request, response, next) {
  try { response.json(await orderService.reorder(request.user.sub, request.params.orderCode)) }
  catch (error) { next(error) }
}
