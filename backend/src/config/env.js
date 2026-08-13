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
}

export default env
