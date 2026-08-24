import mongoose from 'mongoose'
import Product from '../models/product.model.js'
import VirtualTryOn from '../models/VirtualTryOn.js'
import vtonService from '../services/vton.service.js'
import { AppError } from '../utils/AppError.js'

// Danh sách người mẫu mẫu (Sample Models) chất lượng cao sẵn sàng cho người dùng thử nhanh
const SAMPLE_MODELS = [
  {
    id: 'female_1',
    name: 'Nữ - Trẻ trung',
    gender: 'female',
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'female_2',
    name: 'Nữ - Thanh lịch',
    gender: 'female',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'male_1',
    name: 'Nam - Năng động',
    gender: 'male',
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'male_2',
    name: 'Nam - Công sở',
    gender: 'male',
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
  },
]

/**
 * Trích xuất và hợp lệ hóa dữ liệu đầu vào cho yêu cầu Thử đồ ảo
 */
async function resolveTryOnInputs(request) {
  const files = request.files || {}
  const body = request.body || {}

  // 1. Xác định ảnh người mẫu (Person Image)
  let personImageUrl = body.person_image || body.personImageUrl
  if (files.person_image && files.person_image[0]) {
    personImageUrl = files.person_image[0].path || files.person_image[0].secure_url
  }

  if (!personImageUrl) {
    throw new AppError('Vui lòng cung cấp ảnh người mẫu (tải file hoặc chọn ảnh mẫu)', 400)
  }

  // 2. Xác định ảnh trang phục (Garment Image) & thông tin sản phẩm
  let garmentImageUrl = body.garment_image || body.garmentImageUrl
  let productId = body.product_id || body.productId || null
  let productTitle = body.description || ''

  if (files.garment_image && files.garment_image[0]) {
    garmentImageUrl = files.garment_image[0].path || files.garment_image[0].secure_url
  }

  if (productId && mongoose.isValidObjectId(productId)) {
    const product = await Product.findById(productId).lean()
    if (product) {
      if (!garmentImageUrl) {
        garmentImageUrl = product.image_assets?.[0]?.url || product.images?.[0]
      }
      if (!productTitle) {
        productTitle = `${product.name} ${product.brand ? `(${product.brand})` : ''}`
      }
    }
  }

  if (!garmentImageUrl) {
    throw new AppError('Vui lòng cung cấp ảnh trang phục hoặc ID sản phẩm hợp lệ', 400)
  }

  const category = ['upper_body', 'lower_body', 'dresses', 'all'].includes(body.category)
    ? body.category
    : 'upper_body'

  const denoiseSteps = Math.min(50, Math.max(15, parseInt(body.denoise_steps, 10) || 30))
  const seed = parseInt(body.seed, 10) || 42
  const autoCrop = body.auto_crop === 'true' || body.auto_crop === true

  return {
    personImageUrl,
    garmentImageUrl,
    productId,
    productTitle,
    category,
    denoiseSteps,
    seed,
    autoCrop,
  }
}

/**
 * [POST] /api/v1/try-on/generate
 * Thực hiện thử đồ trực tiếp (Synchronous) và chờ kết quả trả về
 */
export async function generateTryOnSync(request, response, next) {
  try {
    const userId = request.user?.sub || null
    const {
      personImageUrl,
      garmentImageUrl,
      productId,
      productTitle,
      category,
      denoiseSteps,
      seed,
      autoCrop,
    } = await resolveTryOnInputs(request)

    // Tạo bản ghi theo dõi trong DB
    const tryOnRecord = await VirtualTryOn.create({
      user: userId,
      product: productId,
      person_image: personImageUrl,
      garment_image: garmentImageUrl,
      category,
      description: productTitle,
      denoise_steps: denoiseSteps,
      seed,
      auto_crop: autoCrop,
      status: 'processing',
    })

    try {
      const result = await vtonService.executeVtonInference({
        personImageUrl,
        garmentImageUrl,
        category,
        description: productTitle,
        denoiseSteps,
        seed,
        autoCrop,
      })

      tryOnRecord.result_image = result.resultImageUrl
      tryOnRecord.status = 'completed'
      tryOnRecord.execution_time_ms = result.executionTimeMs
      tryOnRecord.metadata = {
        cloudinary: result.cloudinaryMeta,
      }
      await tryOnRecord.save()

      return response.status(200).json({
        success: true,
        message: 'Thử đồ bằng AI hoàn tất thành công!',
        data: {
          id: tryOnRecord._id,
          resultImage: tryOnRecord.result_image,
          personImage: tryOnRecord.person_image,
          garmentImage: tryOnRecord.garment_image,
          category: tryOnRecord.category,
          executionTimeMs: tryOnRecord.execution_time_ms,
          createdAt: tryOnRecord.createdAt,
        },
      })
    } catch (inferError) {
      tryOnRecord.status = 'failed'
      tryOnRecord.error_message = inferError.message
      await tryOnRecord.save()
      throw inferError
    }
  } catch (error) {
    next(error)
  }
}

/**
 * [POST] /api/v1/try-on/submit
 * Tạo tác vụ thử đồ chạy ngầm (Asynchronous) và trả về task_id ngay lập tức
 */
export async function submitTryOnTask(request, response, next) {
  try {
    const userId = request.user?.sub || null
    const {
      personImageUrl,
      garmentImageUrl,
      productId,
      productTitle,
      category,
      denoiseSteps,
      seed,
      autoCrop,
    } = await resolveTryOnInputs(request)

    const tryOnRecord = await VirtualTryOn.create({
      user: userId,
      product: productId,
      person_image: personImageUrl,
      garment_image: garmentImageUrl,
      category,
      description: productTitle,
      denoise_steps: denoiseSteps,
      seed,
      auto_crop: autoCrop,
      status: 'pending',
    })

    // Kích hoạt xử lý ngầm (không await)
    vtonService.processAsyncTryOnTask(tryOnRecord._id).catch((err) => {
      console.error(`[VTON Controller] Lỗi background task ${tryOnRecord._id}:`, err.message)
    })

    return response.status(202).json({
      success: true,
      message: 'Đã tiếp nhận yêu cầu thử đồ. AI đang tiến hành xử lý.',
      data: {
        taskId: tryOnRecord._id,
        status: tryOnRecord.status,
        socketRoom: `vton_task_${tryOnRecord._id}`,
        createdAt: tryOnRecord.createdAt,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * [GET] /api/v1/try-on/tasks/:id
 * Kiểm tra trạng thái tác vụ thử đồ ngầm
 */
export async function getTaskStatus(request, response, next) {
  try {
    const { id } = request.params
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError('ID tác vụ không hợp lệ', 400)
    }

    const task = await VirtualTryOn.findById(id).lean()
    if (!task) {
      throw new AppError('Không tìm thấy tác vụ thử đồ', 404)
    }

    return response.status(200).json({
      success: true,
      data: {
        taskId: task._id,
        status: task.status,
        resultImage: task.result_image,
        errorMessage: task.error_message,
        executionTimeMs: task.execution_time_ms,
        personImage: task.person_image,
        garmentImage: task.garment_image,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * [GET] /api/v1/try-on/history
 * Lấy danh sách lịch sử thử đồ của người dùng hiện tại
 */
export async function getTryOnHistory(request, response, next) {
  try {
    const userId = request.user?.sub
    if (!userId) {
      throw new AppError('Yêu cầu đăng nhập để xem lịch sử thử đồ', 401)
    }

    const { page, limit } = request.query
    const history = await vtonService.getUserTryOnHistory(userId, { page, limit })

    return response.status(200).json({
      success: true,
      data: history,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * [DELETE] /api/v1/try-on/history/:id
 * Xóa một bản ghi lịch sử thử đồ
 */
export async function deleteTryOnHistory(request, response, next) {
  try {
    const userId = request.user?.sub
    const { id } = request.params

    if (!mongoose.isValidObjectId(id)) {
      throw new AppError('ID bản ghi không hợp lệ', 400)
    }

    await vtonService.deleteTryOnRecord(id, userId)

    return response.status(200).json({
      success: true,
      message: 'Đã xóa bản ghi lịch sử thử đồ thành công',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * [GET] /api/v1/try-on/sample-models
 * Lấy danh sách ảnh người mẫu mẫu có sẵn
 */
export async function getSampleModels(request, response) {
  return response.status(200).json({
    success: true,
    data: SAMPLE_MODELS,
  })
}

export default {
  generateTryOnSync,
  submitTryOnTask,
  getTaskStatus,
  getTryOnHistory,
  deleteTryOnHistory,
  getSampleModels,
}
