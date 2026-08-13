import express from 'express'
import { createReview, deleteReview, getProductReviews, getReviewEligibility, updateReview } from '../controllers/review.controller.js'
import { verifyToken } from '../middlewares/verifyToken.js'

const router = express.Router()
router.get('/:productId', getProductReviews)
router.get('/:productId/eligibility', verifyToken, getReviewEligibility)
router.post('/', verifyToken, createReview)
router.patch('/:reviewId', verifyToken, updateReview)
router.delete('/:reviewId', verifyToken, deleteReview)
export default router
