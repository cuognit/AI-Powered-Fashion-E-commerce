import mongoose from 'mongoose'

const chatSourceSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['product', 'order'],
      required: true,
    },
    id: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      default: '',
    },
    url: {
      type: String,
      default: '',
    },
    score: {
      type: Number,
      default: 0,
    },
    image: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      default: null,
    },
  },
  { _id: false },
)

const chatMessageSchema = new mongoose.Schema(
  {
    conversation_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['complete', 'partial', 'error'],
      default: 'complete',
      index: true,
    },
    sources: {
      type: [chatSourceSchema],
      default: [],
    },
    model: {
      type: String,
      default: 'gemini-3.7-flash',
    },
    provider: {
      type: String,
      default: 'gemini',
    },
    client_message_id: {
      type: String,
      default: null,
    },
    usage: {
      inputTokens: { type: Number, default: 0 },
      outputTokens: { type: Number, default: 0 },
    },
    error_code: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'chat_messages',
  },
)

chatMessageSchema.index({ conversation_id: 1, createdAt: 1 })
chatMessageSchema.index(
  { conversation_id: 1, client_message_id: 1 },
  {
    unique: true,
    partialFilterExpression: {
      client_message_id: { $type: 'string' },
    },
  },
)

export default mongoose.models.ChatMessage || mongoose.model('ChatMessage', chatMessageSchema)


