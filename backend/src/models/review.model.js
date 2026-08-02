import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },

        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },

        content: {
            type: String,
            required: true,
            trim: true
        },
    },
    { timestamps: true },
)

export default mongoose.model('Review', reviewSchema)