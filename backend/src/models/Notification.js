import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    recipientRole: {
      type: String,
      enum: ['customer', 'admin', 'all'],
      default: 'customer',
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'ORDER_CREATED',
        'ORDER_STATUS_UPDATED',
        'PAYMENT_SUCCESS',
        'PAYMENT_FAILED',
        'LOW_STOCK',
        'PROMOTION',
        'SYSTEM',
      ],
      default: 'SYSTEM',
      index: true,
    },
    data: {
      orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
      orderCode: { type: String, default: null },
      url: { type: String, default: null },
      metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
)

// Compound indexes for fast querying by recipient and unread status
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 })
notificationSchema.index({ recipientRole: 1, isRead: 1, createdAt: -1 })

export default mongoose.model('Notification', notificationSchema)
