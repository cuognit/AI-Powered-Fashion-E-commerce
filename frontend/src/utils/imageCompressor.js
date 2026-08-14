import imageCompression from 'browser-image-compression'

const DEFAULT_COMPRESS_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  initialQuality: 0.85,
}

/**
 * Nén một file ảnh đơn lẻ
 * @param {File} file - File ảnh gốc được chọn từ input
 * @param {Object} customOptions - Tùy chọn nén ghi đè (nếu có)
 * @returns {Promise<{ file: File, originalSize: number, compressedSize: number, ratio: number }>}
 */
export async function compressImage(file, customOptions = {}) {
  if (!file || !(file instanceof File)) {
    throw new Error('File không hợp lệ để nén')
  }

  // Bỏ qua nếu là file svg hoặc gif
  if (['image/svg+xml', 'image/gif'].includes(file.type)) {
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      ratio: 0,
    }
  }

  const options = { ...DEFAULT_COMPRESS_OPTIONS, ...customOptions }
  const originalSize = file.size

  try {
    const compressedBlob = await imageCompression(file, options)
    // Giữ nguyên tên file gốc nhưng cập nhật lại File object
    const compressedFile = new File([compressedBlob], file.name, {
      type: compressedBlob.type || file.type,
      lastModified: Date.now(),
    })

    const compressedSize = compressedFile.size
    const ratio = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100))

    return {
      file: compressedFile,
      originalSize,
      compressedSize,
      ratio,
    }
  } catch (error) {
    console.warn(`[ImageCompressor] Lỗi khi nén file "${file.name}", giữ nguyên file gốc:`, error.message)
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      ratio: 0,
    }
  }
}

/**
 * Nén danh sách nhiều file ảnh song song với báo tiến trình
 * @param {File[]} files - Mảng các file ảnh
 * @param {(current: number, total: number, latestResult?: any) => void} onProgress - Callback cập nhật tiến độ
 * @returns {Promise<Array<{ file: File, originalSize: number, compressedSize: number, ratio: number }>>}
 */
export async function compressImageBatch(files = [], onProgress) {
  if (!Array.isArray(files) || files.length === 0) return []

  const total = files.length
  let completed = 0

  const results = await Promise.all(
    files.map(async (file, index) => {
      try {
        const result = await compressImage(file)
        completed += 1
        if (typeof onProgress === 'function') {
          onProgress(completed, total, { index, name: file.name, ...result })
        }
        return result
      } catch (err) {
        completed += 1
        if (typeof onProgress === 'function') {
          onProgress(completed, total, { index, name: file.name, error: err })
        }
        return { file, originalSize: file.size, compressedSize: file.size, ratio: 0 }
      }
    })
  )

  return results
}
