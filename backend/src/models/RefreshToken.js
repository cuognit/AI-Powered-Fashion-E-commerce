import mongoose from 'mongoose'

const refreshTokenSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    token_hash: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    expires_at: {
      type: Date,
      required: true,
    },
    revoked_at: {
      type: Date,
      default: null,
    },
    last_used_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    collection: 'refresh_tokens',
  },
)

refreshTokenSchema.index({ user_id: 1, revoked_at: 1 })
refreshTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 })

export default mongoose.model('RefreshToken', refreshTokenSchema)
