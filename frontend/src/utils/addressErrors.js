// Thông báo riêng của Address Book; không đưa message/stack nội bộ từ server ra UI.
export function addressErrorMessage(error, { mutation = false } = {}) {
  const status = error.response?.status
  if (error.code === 'ADDRESS_RELOAD_REQUIRED') return 'Vui lòng tải lại danh sách trước khi thực hiện tiếp.'
  if (status === 400) {
    return error.response?.data?.details?.fieldErrors
      ? 'Thông tin địa chỉ chưa hợp lệ. Vui lòng kiểm tra các trường được đánh dấu.'
      : 'Yêu cầu địa chỉ không hợp lệ. Vui lòng kiểm tra lại.'
  }
  if (status === 401) return 'Phiên đăng nhập không còn hợp lệ. Vui lòng đăng nhập lại.'
  if (status === 403) return 'Bạn không có quyền thực hiện thao tác này.'
  if (status === 404) return 'Địa chỉ không còn tồn tại hoặc không thuộc tài khoản hiện tại. Vui lòng tải lại danh sách.'
  if (status === 409) return 'Sổ địa chỉ đã thay đổi. Vui lòng tải lại danh sách và đối chiếu trước khi thực hiện tiếp.'
  const uncertain = mutation ? ' Máy chủ có thể đã ghi thay đổi. Tải lại danh sách để đối chiếu trước khi gửi lại.' : ' Vui lòng thử tải lại danh sách.'
  if (status >= 500) return `Máy chủ chưa trả được kết quả hợp lệ.${uncertain}`
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') return `Yêu cầu chờ quá lâu.${uncertain}`
  if (error.code === 'ERR_CANCELED' || error.name === 'CanceledError') {
    if (error.addressRequestStarted === false) return 'Đã hủy yêu cầu trước khi gửi dữ liệu.'
    return `Đã dừng chờ phản hồi ở trình duyệt.${uncertain}`
  }
  return `Không nhận được phản hồi từ máy chủ.${uncertain}`
}
