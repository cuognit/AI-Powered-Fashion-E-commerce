import axiosClient from './axiosClient.js'

export const login = (credentials) => axiosClient.post('/auth/login', credentials)
export const register = (payload) => axiosClient.post('/auth/register', payload)
export const getProfile = () => axiosClient.get('/auth/me')
