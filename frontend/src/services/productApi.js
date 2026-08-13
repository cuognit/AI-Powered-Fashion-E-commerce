import axiosClient from './axiosClient.js'

export const getProducts = (params) => axiosClient.get('/products', { params })
export const getProductFacets = () => axiosClient.get('/products/facets')
export const searchProducts = (params) => axiosClient.get('/search/semantic', { params })
export const getProductById = (id) => axiosClient.get(`/products/${id}`)
