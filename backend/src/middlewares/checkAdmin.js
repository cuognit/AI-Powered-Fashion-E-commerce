import { AppError } from '../utils/AppError.js'

export function checkAdmin(request, _response, next) {
  if (request.user?.role !== 'admin') {
    return next(new AppError('Bạn không có quyền truy cập', 403))
  }

  next()
}
