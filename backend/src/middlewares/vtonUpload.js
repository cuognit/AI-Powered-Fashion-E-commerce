import multer from 'multer'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import cloudinary from '../config/cloudinary.js'

const vtonStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'fashion-ecommerce/vton-inputs',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
})

export const vtonUpload = multer({
  storage: vtonStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Tối đa 10MB cho ảnh người mẫu/trang phục
}).fields([
  { name: 'person_image', maxCount: 1 },
  { name: 'garment_image', maxCount: 1 },
])

export default vtonUpload
