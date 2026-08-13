export function notFound(request, _response, next) {
  const error = new Error(`Không tìm thấy ${request.method} ${request.originalUrl}`)
  error.statusCode = 404
  next(error)
}

export function errorHandler(error, _request, response, _next) {
  const statusCode = error.statusCode || 500

  // Log unexpected errors so a bare "500" in morgan can be traced back to a cause.
  if (statusCode >= 500) {
    console.error(`[errorHandler] ${error.message}\n${error.stack || ''}`)
  }

  if (error.retryAfterSeconds) response.set('Retry-After', String(error.retryAfterSeconds))

  response.status(statusCode).json({
    message: error.statusCode ? error.message : 'Lỗi máy chủ',
    ...(error.retryAfterSeconds && { retryAfterSeconds: error.retryAfterSeconds }),
    ...(error.details && { details: error.details }),
  })
}
