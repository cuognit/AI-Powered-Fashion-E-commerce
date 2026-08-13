import * as cartService from '../services/cartService.js'

export async function getCart(request, response, next) {
  try { response.json(await cartService.getCart(request.user.sub)) } catch (error) { next(error) }
}

export async function addItem(request, response, next) {
  try { response.status(201).json(await cartService.addItem(request.user.sub, request.body)) } catch (error) { next(error) }
}

export async function updateItem(request, response, next) {
  try {
    response.json(await cartService.setItemQuantity(request.user.sub, request.params.variantSku, request.body.quantity))
  } catch (error) { next(error) }
}

export async function removeItem(request, response, next) {
  try { response.json(await cartService.removeItem(request.user.sub, request.params.variantSku)) } catch (error) { next(error) }
}

export async function clearCart(request, response, next) {
  try { response.json(await cartService.clearCart(request.user.sub)) } catch (error) { next(error) }
}
