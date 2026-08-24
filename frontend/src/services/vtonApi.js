import axiosClient from './axiosClient.js'

/**
 * Lấy danh sách người mẫu mẫu có sẵn
 */
export const getSampleModels = () => axiosClient.get('/try-on/sample-models')

/**
 * Thử đồ trực tiếp (Synchronous - Chờ AI trả về kết quả)
 * @param {FormData|Object} data - Chứa ảnh người mẫu, trang phục hoặc ID sản phẩm
 */
export const generateTryOn = (data) => {
  const isFormData = data instanceof FormData
  return axiosClient.post('/try-on/generate', data, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    timeout: 150000, // Timeout dài cho tác vụ AI
  })
}

/**
 * Tạo tác vụ thử đồ chạy ngầm (Asynchronous - Trả về taskId)
 * @param {FormData|Object} data
 */
export const submitTryOnTask = (data) => {
  const isFormData = data instanceof FormData
  return axiosClient.post('/try-on/submit', data, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
  })
}

/**
 * Lấy trạng thái của tác vụ thử đồ ngầm
 * @param {string} taskId
 */
export const getTryOnTaskStatus = (taskId) => axiosClient.get(`/try-on/tasks/${taskId}`)

/**
 * Lấy lịch sử thử đồ của người dùng
 * @param {Object} params - { page, limit }
 */
export const getTryOnHistory = (params) => axiosClient.get('/try-on/history', { params })

/**
 * Xóa một bản ghi lịch sử thử đồ
 * @param {string} id
 */
export const deleteTryOnHistory = (id) => axiosClient.delete(`/try-on/history/${id}`)

export default {
  getSampleModels,
  generateTryOn,
  submitTryOnTask,
  getTryOnTaskStatus,
  getTryOnHistory,
  deleteTryOnHistory,
}
