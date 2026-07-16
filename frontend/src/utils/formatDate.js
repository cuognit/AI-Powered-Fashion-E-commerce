export const formatDate = (value) =>
  new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(value))
