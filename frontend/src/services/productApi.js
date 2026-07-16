import axiosClient from './axiosClient.js'

export const getProducts = (params) => axiosClient.get('/products', { params })
export const getProductById = (id) => axiosClient.get(`/products/${id}`)
