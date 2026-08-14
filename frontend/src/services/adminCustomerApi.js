import axiosClient from './axiosClient.js'

export const listAdminUsers = (params) => axiosClient.get('/admin/users', { params }).then(({ data }) => data)
export const listAdminCustomers = listAdminUsers

export const getAdminUser = (userId) => axiosClient.get(`/admin/users/${encodeURIComponent(userId)}`).then(({ data }) => data)
export const getAdminCustomer = getAdminUser

export const listAdminUserOrders = (userId, params) => axiosClient.get(`/admin/users/${encodeURIComponent(userId)}/orders`, { params }).then(({ data }) => data)
export const listAdminCustomerOrders = listAdminUserOrders

export const updateAdminUser = (userId, data) => axiosClient.patch(`/admin/users/${encodeURIComponent(userId)}`, data).then(({ data: responseData }) => responseData)
