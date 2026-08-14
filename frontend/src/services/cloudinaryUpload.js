import axios from 'axios'
import axiosClient from './axiosClient.js'
import { compressImageBatch } from '../utils/imageCompressor.js'

/**
 * Lấy chữ ký số Signed Upload từ Backend
 * @returns {Promise<{ signature: string, timestamp: number, folder: string, apiKey: string, cloudName: string }>}
 */
export async function getUploadSignature() {
  const response = await axiosClient.get('/admin/products/upload-signature')
  return response.data.data
}

/**
 * Upload 1 file ảnh trực tiếp lên Cloudinary API bằng Signed Signature
 * @param {File} file - File ảnh (thường đã qua nén)
 * @param {Object} signatureData - Dữ liệu chữ ký từ backend
 * @param {(progressPercent: number) => void} onProgress - Callback tiến độ upload (0 - 100)
 * @returns {Promise<{ url: string, public_id: string, width: number, height: number, format: string }>}
 */
export async function uploadSingleToCloudinary(file, signatureData, onProgress) {
  const { signature, timestamp, folder, apiKey, cloudName } = signatureData

  if (!cloudName || !apiKey || !signature) {
    throw new Error('Thiếu thông tin chữ ký xác thực Cloudinary')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('api_key', apiKey)
  formData.append('timestamp', String(timestamp))
  formData.append('signature', signature)
  formData.append('folder', folder)

  // Gọi trực tiếp Cloudinary endpoint bằng instance axios sạch (không gắn auth header của app)
  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`

  const response = await axios.post(uploadUrl, formData, {
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && typeof onProgress === 'function') {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress(percent)
      }
    },
  })

  const data = response.data
  return {
    url: data.secure_url || data.url,
    public_id: data.public_id,
    width: data.width,
    height: data.height,
    format: data.format,
  }
}

/**
 * Luồng hoàn chỉnh: Nén ảnh ➔ Lấy signature ➔ Upload song song lên Cloudinary
 * @param {File[]} files - Danh sách các file ảnh mới
 * @param {(status: { stage: 'compressing' | 'uploading' | 'done' | 'error', current: number, total: number, message: string }) => void} onStatusUpdate
 * @returns {Promise<Array<{ url: string, public_id: string }>>}
 */
export async function compressAndUploadToCloudinary(files = [], onStatusUpdate) {
  if (!files || files.length === 0) return []

  const total = files.length

  // Giai đoạn 1: Nén ảnh tại Client
  if (typeof onStatusUpdate === 'function') {
    onStatusUpdate({
      stage: 'compressing',
      current: 0,
      total,
      message: `Đang nén 0/${total} ảnh...`,
    })
  }

  const compressedResults = await compressImageBatch(files, (curr, tot) => {
    if (typeof onStatusUpdate === 'function') {
      onStatusUpdate({
        stage: 'compressing',
        current: curr,
        total: tot,
        message: `Đang nén ${curr}/${tot} ảnh...`,
      })
    }
  })

  // Giai đoạn 2: Lấy Upload Signature từ Backend
  if (typeof onStatusUpdate === 'function') {
    onStatusUpdate({
      stage: 'uploading',
      current: 0,
      total,
      message: `Đang xác thực bảo mật với Cloudinary...`,
    })
  }

  const signatureData = await getUploadSignature()

  // Giai đoạn 3: Upload song song lên Cloudinary
  let uploadedCount = 0
  const uploadedAssets = await Promise.all(
    compressedResults.map(async ({ file }) => {
      const uploaded = await uploadSingleToCloudinary(file, signatureData)
      uploadedCount += 1
      if (typeof onStatusUpdate === 'function') {
        onStatusUpdate({
          stage: 'uploading',
          current: uploadedCount,
          total,
          message: `Đã tải lên Cloudinary ${uploadedCount}/${total} ảnh...`,
        })
      }
      return uploaded
    })
  )

  if (typeof onStatusUpdate === 'function') {
    onStatusUpdate({
      stage: 'done',
      current: total,
      total,
      message: `Đã tải lên thành công ${total} ảnh!`,
    })
  }

  return uploadedAssets
}
