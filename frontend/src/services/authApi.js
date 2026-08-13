import axiosClient from './axiosClient.js'

export const login = (credentials) => axiosClient.post('/auth/login', credentials)
export const register = (payload) => axiosClient.post('/auth/register', payload)
export const logout = () => axiosClient.post('/auth/logout')
export const getProfile = () => axiosClient.get('/auth/me')
export const updateProfile = (payload) => axiosClient.patch('/auth/me', payload)
export const changePassword = (payload) => axiosClient.post('/auth/change-password', payload)
