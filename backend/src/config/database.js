import mongoose from 'mongoose'

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI

  if (!uri) {
    throw new Error('MONGODB_URI chưa được cấu hình')
  }

  await mongoose.connect(uri)
  console.log('Đã kết nối MongoDB')
}
