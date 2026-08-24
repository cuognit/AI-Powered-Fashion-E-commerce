import { Client, handle_file } from '@gradio/client'
import env from '../config/env.js'
import cloudinary from '../config/cloudinary.js'
import VirtualTryOn from '../models/VirtualTryOn.js'
import { emitToUser, getIO } from '../config/socket.js'
import { AppError } from '../utils/AppError.js'

let cachedClient = null
let isConnecting = false

/**
 * Khởi tạo hoặc tái sử dụng Gradio Client kết nối tới Hugging Face Space
 */
export async function getHfClient() {
  if (cachedClient) {
    return cachedClient
  }

  if (isConnecting) {
    // Đợi kết nối đang khởi tạo hoàn tất
    while (isConnecting) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      if (cachedClient) return cachedClient
    }
  }

  isConnecting = true
  try {
    const spaceId = env.vton.spaceId || 'yisol/IDM-VTON'
    const options = {}
    if (env.vton.hfToken) {
      options.token = env.vton.hfToken
      options.hf_token = env.vton.hfToken
    }

    console.log(`[VTON Service] Khởi tạo kết nối tới Hugging Face Space: ${spaceId}`)
    cachedClient = await Client.connect(spaceId, options)
    console.log(`[VTON Service] Kết nối Hugging Face Space ${spaceId} thành công!`)
    return cachedClient
  } catch (error) {
    console.error('[VTON Service] Lỗi khi kết nối tới Hugging Face Space:', error.message)
    cachedClient = null
    throw new AppError(`Không thể kết nối tới mô hình AI Virtual Try-On (${error.message})`, 503)
  } finally {
    isConnecting = false
  }
}

/**
 * Chuyển đổi URL hình ảnh hoặc Buffer thành định dạng Gradio FileData
 */
async function toGradioFile(input) {
  if (!input) return null

  if (typeof input === 'string' && (input.startsWith('http://') || input.startsWith('https://'))) {
    try {
      const response = await fetch(input)
      if (!response.ok) {
        throw new Error(`Fetch HTTP error: ${response.status} ${response.statusText}`)
      }
      const arrayBuffer = await response.arrayBuffer()
      const contentType = response.headers.get('content-type') || 'image/jpeg'
      const blob = new Blob([arrayBuffer], { type: contentType })
      return handle_file(blob)
    } catch (err) {
      console.warn(`[VTON Service] Chuyển đổi qua Blob thất bại, thử gọi trực tiếp URL với handle_file:`, err.message)
      return handle_file(input)
    }
  }

  if (input instanceof Blob || input instanceof Buffer) {
    return handle_file(input)
  }

  return handle_file(input)
}

/**
 * Upload kết quả render từ Hugging Face lên Cloudinary
 */
async function uploadResultToCloudinary(outputFile) {
  let fileToUpload = outputFile

  if (typeof outputFile === 'object' && outputFile !== null) {
    fileToUpload = outputFile.url || outputFile.path || outputFile
  }

  if (typeof fileToUpload !== 'string') {
    throw new Error('Định dạng ảnh kết quả từ AI không hợp lệ')
  }

  console.log('[VTON Service] Đang upload ảnh kết quả lên Cloudinary...')
  const result = await cloudinary.uploader.upload(fileToUpload, {
    folder: 'fashion-ecommerce/try-on',
    resource_type: 'image',
  })

  return {
    url: result.secure_url,
    public_id: result.public_id,
    width: result.width,
    height: result.height,
  }
}

/**
 * Render dự phòng qua mô hình OOTDiffusion với cấu hình chất lượng cao (HD Upper-body & DC Full-body)
 */
async function executeOotdInference({ personFile, garmentFile, category, denoiseSteps, seed }) {
  console.log('[VTON Service] 🚀 Đang kích hoạt Engine 2 (levihsu/OOTDiffusion) với cấu hình Ultra HD...')
  const options = {}
  if (env.vton.hfToken) {
    options.token = env.vton.hfToken
  }

  const ootdClient = await Client.connect('levihsu/OOTDiffusion', options)

  const steps = Math.min(40, Math.max(28, Number(denoiseSteps) || 30))
  const guidanceScale = 2.5 // Tăng độ bám sát trang phục lên 2.5 để ảnh không bị biến dạng
  const randomSeed = Number(seed) > 0 ? Number(seed) : 42

  let response
  if (category === 'upper_body' || !category) {
    // Chế độ HD chuyên biệt cho Áo (Upper-body): Giữ nguyên 100% gương mặt và làn da
    console.log('[VTON Service] Sử dụng endpoint /process_hd (High-Definition 768x1024 cho Áo)...')
    response = await ootdClient.predict('/process_hd', [
      personFile,
      garmentFile,
      1, // n_samples
      steps, // n_steps (30-40)
      guidanceScale, // image_scale
      randomSeed, // seed
    ])
  } else {
    // Chế độ DC cho Váy đầm (Dress) hoặc Quần (Lower-body)
    const categoryMap = {
      lower_body: 'Lower-body',
      dresses: 'Dress',
    }
    const ootdCat = categoryMap[category] || 'Dress'
    console.log(`[VTON Service] Sử dụng endpoint /process_dc (Chế độ ${ootdCat})...`)
    response = await ootdClient.predict('/process_dc', [
      personFile,
      garmentFile,
      ootdCat,
      1, // n_samples
      steps,
      guidanceScale,
      randomSeed,
    ])
  }

  const gallery = response?.data?.[0]
  const firstItem = Array.isArray(gallery) ? gallery[0] : gallery
  const outputData = firstItem?.image?.url || firstItem?.image?.path || firstItem?.image || firstItem

  if (!outputData) {
    throw new AppError('Mô hình OOTDiffusion không trả về ảnh kết quả hợp lệ', 502)
  }

  return outputData
}


/**
 * Thực thi render thử đồ qua Hugging Face (IDM-VTON + Tự động Fallback sang OOTDiffusion hoàn toàn miễn phí)
 */
export async function executeVtonInference({
  personImageUrl,
  garmentImageUrl,
  category = 'upper_body',
  description = 'clothing item',
  denoiseSteps = 30,
  seed = 42,
  autoCrop = false,
}) {
  const startTime = Date.now()
  const timeoutMs = env.vton.timeoutMs || 120000

  console.log('[VTON Service] Chuẩn bị dữ liệu hình ảnh...')
  const [personFile, garmentFile] = await Promise.all([
    toGradioFile(personImageUrl),
    toGradioFile(garmentImageUrl),
  ])

  const humanEditorDict = {
    background: personFile,
    layers: [],
    composite: null,
  }

  let outputData = null

  // 1. Thử nghiệm với Engine 1: yisol/IDM-VTON
  try {
    console.log('[VTON Service] Thử nghiệm với Engine 1 (yisol/IDM-VTON)...')
    const client = await getHfClient()

    const predictPromise = client.predict('/tryon', [
      humanEditorDict,
      garmentFile,
      description || 'clothing item',
      true, // is_checked (auto-masking)
      Boolean(autoCrop), // is_checked_crop
      Number(denoiseSteps) || 30, // denoise_steps
      Number(seed) || 42, // seed
    ])

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new AppError(`Hệ thống AI xử lý quá thời gian (${timeoutMs / 1000}s).`, 504)),
        timeoutMs
      )
    )

    const response = await Promise.race([predictPromise, timeoutPromise])
    outputData = response?.data?.[0]
    console.log('[VTON Service] Render IDM-VTON thành công!')
  } catch (error) {
    console.warn(`[VTON Service] Engine 1 (IDM-VTON) bận hoặc lỗi: ${error.message}`)

    // 2. Tự động chuyển ngay sang Engine 2: levihsu/OOTDiffusion (100% Miễn phí & Độc lập)
    try {
      outputData = await executeOotdInference({
        personFile,
        garmentFile,
        category,
        denoiseSteps,
        seed,
      })
      console.log('[VTON Service] Render qua Engine dự phòng OOTDiffusion thành công!')
    } catch (fallbackError) {
      console.error('[VTON Service] Cả 2 Engine đều thất bại:', fallbackError.message)
      throw new AppError(
        'Hàng đợi GPU công cộng đang bận. Vui lòng bấm "Thử lại" sau vài giây.',
        503
      )
    }
  }

  if (!outputData) {
    throw new AppError('Mô hình AI không trả về kết quả hình ảnh hợp lệ', 502)
  }

  const cloudinaryResult = await uploadResultToCloudinary(outputData)
  const renderDurationMs = Date.now() - startTime

  return {
    resultImageUrl: cloudinaryResult.url,
    cloudinaryMeta: cloudinaryResult,
    executionTimeMs: renderDurationMs,
  }
}



/**
 * Xử lý tác vụ thử đồ bất đồng bộ (Asynchronous Background Job)
 */
export async function processAsyncTryOnTask(tryOnId) {
  const tryOnDoc = await VirtualTryOn.findById(tryOnId)
  if (!tryOnDoc) {
    console.warn(`[VTON Service] Không tìm thấy Task ${tryOnId}`)
    return
  }

  try {
    tryOnDoc.status = 'processing'
    await tryOnDoc.save()

    // Bắn sự kiện Socket.io báo trạng thái đang xử lý
    notifyTaskStatus(tryOnDoc)

    const result = await executeVtonInference({
      personImageUrl: tryOnDoc.person_image,
      garmentImageUrl: tryOnDoc.garment_image,
      category: tryOnDoc.category,
      description: tryOnDoc.description,
      denoiseSteps: tryOnDoc.denoise_steps,
      seed: tryOnDoc.seed,
      autoCrop: tryOnDoc.auto_crop,
    })

    tryOnDoc.result_image = result.resultImageUrl
    tryOnDoc.status = 'completed'
    tryOnDoc.execution_time_ms = result.executionTimeMs
    tryOnDoc.metadata = {
      ...tryOnDoc.metadata,
      cloudinary: result.cloudinaryMeta,
    }
    await tryOnDoc.save()

    // Bắn sự kiện Socket.io báo hoàn thành
    notifyTaskStatus(tryOnDoc)
    console.log(`[VTON Service] Task ${tryOnId} hoàn thành thành công!`)
  } catch (error) {
    console.error(`[VTON Service] Task ${tryOnId} thất bại:`, error.message)
    tryOnDoc.status = 'failed'
    tryOnDoc.error_message = error.message || 'Lỗi không xác định khi xử lý AI'
    await tryOnDoc.save()

    // Bắn sự kiện Socket.io báo lỗi
    notifyTaskStatus(tryOnDoc)
  }
}

/**
 * Gửi thông báo Socket.io cho User hoặc phòng task riêng biệt
 */
function notifyTaskStatus(tryOnDoc) {
  const payload = {
    taskId: tryOnDoc._id,
    status: tryOnDoc.status,
    resultImage: tryOnDoc.result_image,
    errorMessage: tryOnDoc.error_message,
    executionTimeMs: tryOnDoc.execution_time_ms,
    updatedAt: tryOnDoc.updatedAt,
  }

  if (tryOnDoc.user) {
    emitToUser(tryOnDoc.user, 'vton:status_update', payload)
  }

  const io = getIO()
  if (io) {
    // Phát thông báo vào room riêng của task (cho cả khách vãng lai nếu join room)
    io.to(`vton_task_${tryOnDoc._id}`).emit('vton:status_update', payload)
  }
}

/**
 * Lấy lịch sử thử đồ của User
 */
export async function getUserTryOnHistory(userId, { page = 1, limit = 10 } = {}) {
  const safePage = Math.max(1, parseInt(page, 10) || 1)
  const safeLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10))
  const skip = (safePage - 1) * safeLimit

  const [items, total] = await Promise.all([
    VirtualTryOn.find({ user: userId })
      .populate('product', 'name slug price images variants')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    VirtualTryOn.countDocuments({ user: userId }),
  ])

  return {
    items,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  }
}

/**
 * Xóa một bản ghi lịch sử thử đồ
 */
export async function deleteTryOnRecord(tryOnId, userId) {
  const query = { _id: tryOnId }
  if (userId) {
    query.user = userId
  }

  const record = await VirtualTryOn.findOneAndDelete(query)
  if (!record) {
    throw new AppError('Không tìm thấy bản ghi thử đồ hoặc bạn không có quyền xóa', 404)
  }
  return record
}

export default {
  getHfClient,
  executeVtonInference,
  processAsyncTryOnTask,
  getUserTryOnHistory,
  deleteTryOnRecord,
}
