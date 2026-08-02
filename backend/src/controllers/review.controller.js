import Review from '../models/review.model.js';
import User from '../models/User.js';

export const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;

        const reviews = await Review.find({ productId })
            .populate('userId', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy review', error: error.message });
    }
};

export const createReview = async (req, res) => {
    try {
        const { userId, productId, rating, content } = req.body;

        const newReview = new Review({
            userId,
            productId,
            rating,
            content
        });

        await newReview.save();
        res.status(201).json({ success: true, message: 'Đánh giá thành công', data: newReview });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server khi thêm review', error: error.message });
    }
};