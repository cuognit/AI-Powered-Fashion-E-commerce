export default function validate(schema) {
  return (request, _response, next) => {
    const result = schema.safeParse(request.body)

    if (!result.success) {
      return next(Object.assign(new Error('Dữ liệu không hợp lệ'), { statusCode: 400, details: result.error.flatten() }))
    }

    request.body = result.data
    next()
  }
}
