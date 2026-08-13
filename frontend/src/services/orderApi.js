import axiosClient from './axiosClient.js'

export const listOrders = (params) => axiosClient.get('/orders', { params }).then(({ data }) => data)
export const getOrderDetail = (orderCode) => axiosClient.get(`/orders/${encodeURIComponent(orderCode)}`).then(({ data }) => data)
export const cancelOrder = (orderCode, payload) => axiosClient.post(`/orders/${encodeURIComponent(orderCode)}/cancel`, payload).then(({ data }) => data)
export const reorder = (orderCode) => axiosClient.post(`/orders/${encodeURIComponent(orderCode)}/reorder`).then(({ data }) => data)
export const confirmOrderReceived = (orderCode) => axiosClient.patch(`/orders/${encodeURIComponent(orderCode)}/received`).then(({ data }) => data)

export const listAdminOrders = (params) => axiosClient.get('/admin/orders', { params }).then(({ data }) => data)
export const updateAdminOrderStatus = (orderCode, payload) => axiosClient.patch(`/admin/orders/${encodeURIComponent(orderCode)}/status`, payload).then(({ data }) => data)
export const completeAdminRefund = (orderCode, payload) => axiosClient.patch(`/admin/orders/${encodeURIComponent(orderCode)}/refund`, payload).then(({ data }) => data)
