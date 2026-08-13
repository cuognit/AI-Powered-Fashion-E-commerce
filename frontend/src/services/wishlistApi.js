import axiosClient from './axiosClient.js'

export const getWishlist = () => axiosClient.get('/wishlist')
export const addWishlistItem = (productId) => axiosClient.post('/wishlist/items', { productId })
export const removeWishlistItem = (productId) => axiosClient.delete(`/wishlist/items/${productId}`)
