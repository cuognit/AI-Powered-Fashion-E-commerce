import axiosClient from './axiosClient.js'

export const listAdminCustomers = (params) => axiosClient.get('/admin/users', { params }).then(({ data }) => data)
export const getAdminCustomer = (userId) => axiosClient.get(`/admin/users/${encodeURIComponent(userId)}`).then(({ data }) => data)
export const listAdminCustomerOrders = (userId, params) => axiosClient.get(`/admin/users/${encodeURIComponent(userId)}/orders`, { params }).then(({ data }) => data)
