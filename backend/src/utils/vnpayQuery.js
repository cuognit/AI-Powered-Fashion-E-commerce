import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

const value = (input) => input == null ? '' : String(input)

export function signQueryRequest(params, secret) {
  const data = [
    params.vnp_RequestId, params.vnp_Version, params.vnp_Command, params.vnp_TmnCode,
    params.vnp_TxnRef, params.vnp_TransactionDate, params.vnp_CreateDate,
    params.vnp_IpAddr, params.vnp_OrderInfo,
  ].map(value).join('|')
  return createHmac('sha512', secret).update(data, 'utf8').digest('hex')
}

export function signQueryResponse(params, secret) {
  const data = [
    params.vnp_ResponseId, params.vnp_Command, params.vnp_ResponseCode, params.vnp_Message,
    params.vnp_TmnCode, params.vnp_TxnRef, params.vnp_Amount, params.vnp_BankCode,
    params.vnp_PayDate, params.vnp_TransactionNo, params.vnp_TransactionType,
    params.vnp_TransactionStatus, params.vnp_OrderInfo, params.vnp_PromotionCode,
    params.vnp_PromotionAmount,
  ].map(value).join('|')
  return createHmac('sha512', secret).update(data, 'utf8').digest('hex')
}

export function verifyQueryResponse(params, secret) {
  const received = value(params.vnp_SecureHash).toLowerCase()
  if (!/^[a-f0-9]{128}$/.test(received)) return false
  const expected = signQueryResponse(params, secret)
  return timingSafeEqual(Buffer.from(received, 'hex'), Buffer.from(expected, 'hex'))
}

export function queryRequestId() {
  return `${Date.now()}${randomBytes(5).toString('hex')}`.slice(0, 32)
}
