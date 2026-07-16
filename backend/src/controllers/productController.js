import * as productService from '../services/productService.js'

export async function getProducts(_request, response, next) {
  try {
    response.json(await productService.findProducts())
  } catch (error) {
    next(error)
  }
}
