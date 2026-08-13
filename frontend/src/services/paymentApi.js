import axiosClient from './axiosClient.js'

export const createVnpayPayment = (checkout) => axiosClient.post('/payments/vnpay', checkout).then(({ data }) => data)
export const createCodOrder = (checkout) => axiosClient.post('/orders/cod', checkout).then(({ data }) => data)
export const getOrder = (orderCode) => axiosClient.get(`/orders/${encodeURIComponent(orderCode)}`).then(({ data }) => data)
