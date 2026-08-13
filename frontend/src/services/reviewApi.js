import axiosClient from './axiosClient.js'

export const getReviewsByProduct = (productId) => axiosClient.get(`/reviews/${productId}`)
export const getReviewEligibility = (productId) => axiosClient.get(`/reviews/${productId}/eligibility`)
export const addReview = (reviewData) => axiosClient.post('/reviews', reviewData)
export const updateReview = (reviewId, reviewData) => axiosClient.patch(`/reviews/${reviewId}`, reviewData)
export const deleteReview = (reviewId) => axiosClient.delete(`/reviews/${reviewId}`)

export default { getReviewsByProduct, getReviewEligibility, addReview, updateReview, deleteReview }
