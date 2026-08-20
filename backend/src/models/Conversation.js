import mongoose from 'mongoose'

const conversationSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'Cuộc trò chuyện mới',
      trim: true,
    },
    message_count: {
      type: Number,
      default: 0,
      min: 0,
    },
    last_message_at: {
      type: Date,
      default: Date.now,
      index: true,
    },
    is_archived: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'conversations',
  },
)

conversationSchema.index({ user_id: 1, last_message_at: -1 })

export default mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema)
