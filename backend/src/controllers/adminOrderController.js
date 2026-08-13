import * as orderService from '../services/orderService.js'

export async function getOrders(request, response, next) {
  try { response.json(await orderService.listOrdersForAdmin(request.query)) }
  catch (error) { next(error) }
}

export async function updateStatus(request, response, next) {
  try { response.json(await orderService.updateOrderStatus(request.user.sub, request.params.orderCode, request.body)) }
  catch (error) { next(error) }
}

export async function completeRefund(request, response, next) {
  try { response.json(await orderService.completeRefund(request.user.sub, request.params.orderCode, request.body)) }
  catch (error) { next(error) }
}
