import env from '../config/env.js'
import * as checkoutService from '../services/checkoutService.js'

export async function createPayment(request, response, next) {
  try { response.status(201).json(await checkoutService.createVnpayPayment(request.user.sub, request.body, request.ip)) }
  catch (error) { next(error) }
}

export async function ipn(request, response) {
  response.set('Cache-Control', 'no-store')
  try { response.status(200).json(await checkoutService.processVnpayIpn(request.query)) }
  catch (error) {
    console.error('VNPAY IPN processing failed:', error.message)
    response.json({ RspCode: '99', Message: 'Unknown error' })
  }
}

export async function paymentReturn(request, response) {
  const orderCode = await checkoutService.processVnpayReturn(request.query).catch((error) => {
    console.error('VNPAY return processing failed:', error.message)
    return null
  })
  const target = new URL('/payment/result', env.clientUrl)
  if (orderCode) target.searchParams.set('orderCode', orderCode)
  else target.searchParams.set('error', 'invalid-signature')
  response.redirect(302, target.toString())
}
