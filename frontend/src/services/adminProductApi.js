import axiosClient from './axiosClient.js'

export const listAdminProducts = async (params) => (await axiosClient.get('/admin/products', { params })).data
export const getAdminProduct = async (id) => (await axiosClient.get(`/admin/products/${id}`)).data.data
export const saveAdminProduct = async (id, payload, files = []) => {
  const form = new FormData()
  form.append('payload', JSON.stringify(payload))
  files.forEach((file) => form.append('images', file))
  const response = id ? await axiosClient.patch(`/admin/products/${id}`, form) : await axiosClient.post('/admin/products', form)
  return response.data.data
}
export const setAdminProductBusiness = async (id, enabled) => (await axiosClient.patch(`/admin/products/${id}/business`, { enabled })).data.data
export const trashAdminProduct = (id) => axiosClient.delete(`/admin/products/${id}`)
export const restoreAdminProduct = (id) => axiosClient.patch(`/admin/products/${id}/restore`)
export const purgeAdminProduct = (id) => axiosClient.delete(`/admin/products/${id}/permanent`)

export const listAdminCategories = async (params) => (await axiosClient.get('/admin/categories', { params })).data
export const createAdminCategory = async (payload) => (await axiosClient.post('/admin/categories', payload)).data.data
export const updateAdminCategory = async (id, payload) => (await axiosClient.patch(`/admin/categories/${id}`, payload)).data.data
export const trashAdminCategory = (id) => axiosClient.delete(`/admin/categories/${id}`)
export const restoreAdminCategory = (id) => axiosClient.patch(`/admin/categories/${id}/restore`)
export const purgeAdminCategory = (id) => axiosClient.delete(`/admin/categories/${id}/permanent`)

export const listAdminBrands = async (params) => (await axiosClient.get('/admin/brands', { params })).data
export const createAdminBrand = async (payload) => (await axiosClient.post('/admin/brands', payload)).data.data
export const updateAdminBrand = async (id, payload) => (await axiosClient.patch(`/admin/brands/${id}`, payload)).data.data
export const trashAdminBrand = (id) => axiosClient.delete(`/admin/brands/${id}`)
export const restoreAdminBrand = (id) => axiosClient.patch(`/admin/brands/${id}/restore`)
export const purgeAdminBrand = (id) => axiosClient.delete(`/admin/brands/${id}/permanent`)

export const listAdminAttributes = async (params) => (await axiosClient.get('/admin/attributes', { params })).data
export const createAdminAttribute = async (payload) => (await axiosClient.post('/admin/attributes', payload)).data.data
export const updateAdminAttribute = async (id, payload) => (await axiosClient.patch(`/admin/attributes/${id}`, payload)).data.data
export const trashAdminAttribute = (id) => axiosClient.delete(`/admin/attributes/${id}`)
export const restoreAdminAttribute = (id) => axiosClient.patch(`/admin/attributes/${id}/restore`)
export const purgeAdminAttribute = (id) => axiosClient.delete(`/admin/attributes/${id}/permanent`)
export const addAdminAttributeValue = async (id, payload) => (await axiosClient.post(`/admin/attributes/${id}/values`, payload)).data.data
export const updateAdminAttributeValue = async (id, valueId, payload) => (await axiosClient.patch(`/admin/attributes/${id}/values/${valueId}`, payload)).data.data
export const trashAdminAttributeValue = (id, valueId) => axiosClient.delete(`/admin/attributes/${id}/values/${valueId}`)
export const restoreAdminAttributeValue = (id, valueId) => axiosClient.patch(`/admin/attributes/${id}/values/${valueId}/restore`)
