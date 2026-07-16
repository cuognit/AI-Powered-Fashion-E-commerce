export function notFound(request, _response, next) {
  const error = new Error(`Không tìm thấy ${request.method} ${request.originalUrl}`)
  error.statusCode = 404
  next(error)
}

export function errorHandler(error, _request, response, _next) {
  const statusCode = error.statusCode || 500
  response.status(statusCode).json({
    message: error.message || 'Lỗi máy chủ',
    ...(error.details && { details: error.details }),
  })
}
