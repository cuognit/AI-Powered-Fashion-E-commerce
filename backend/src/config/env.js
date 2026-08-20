import 'dotenv/config'

const env = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  trustProxy: process.env.TRUST_PROXY === 'true' ? 1 : false,
  vnpay: {
    tmnCode: process.env.VNPAY_TMN_CODE,
    hashSecret: process.env.VNPAY_HASH_SECRET,
    url: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    queryUrl: process.env.VNPAY_QUERY_URL || 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction',
    queryIp: process.env.VNPAY_QUERY_IP || '127.0.0.1',
    returnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:3000/api/payments/vnpay/return',
    version: process.env.VNPAY_VERSION || '2.1.0',
    locale: process.env.VNPAY_LOCALE || 'vn',
  },
  gemini: {
    keys: [
      process.env.GEMINI_API_KEY_1,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3,
      process.env.GEMINI_API_KEY_4,
      process.env.GEMINI_API_KEY_5,
    ].filter((k) => typeof k === 'string' && k.trim().length > 0),
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    thinkingBudget: Number(process.env.GEMINI_THINKING_BUDGET ?? 0),
    embeddingModel: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-2',
    embeddingDimension: Number(process.env.GEMINI_EMBEDDING_DIMENSION) || 768,
    maxAttempts: Number(process.env.GEMINI_MAX_ATTEMPTS) || 5,
    maxInFlightPerKey: Number(process.env.GEMINI_MAX_IN_FLIGHT_PER_KEY) || 2,
    requestTimeoutMs: Number(process.env.GEMINI_REQUEST_TIMEOUT_MS) || 30000,
    keyCooldownMs: Number(process.env.GEMINI_KEY_COOLDOWN_MS) || 30000,
    invalidKeyCooldownMs: Number(process.env.GEMINI_INVALID_KEY_COOLDOWN_MS) || 600000,
    maxKeyWaitMs: Number(process.env.GEMINI_MAX_KEY_WAIT_MS) || 1000,
    atlasVectorIndex: process.env.ATLAS_GEMINI_VECTOR_INDEX_NAME || 'gemini_vector_index',
  },
  chat: {
    maxMessageChars: Number(process.env.CHAT_MAX_MESSAGE_CHARS) || 2000,
    historyLimit: Number(process.env.CHAT_HISTORY_LIMIT) || 12,
    ragTopK: Number(process.env.CHAT_RAG_TOP_K) || 6,
    orderContextLimit: Number(process.env.CHAT_ORDER_CONTEXT_LIMIT) || 3,
  },
}

export default env
