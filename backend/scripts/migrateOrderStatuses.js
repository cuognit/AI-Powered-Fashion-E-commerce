import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDatabase } from '../src/config/database.js'
import Order from '../src/models/Order.js'

try {
  await connectDatabase()
  const result = await Order.updateMany({ status: 'pending_payment' }, { $set: { status: 'pending' } })
  console.log('Order status migration complete: ' + result.modifiedCount + ' updated')
} finally {
  await mongoose.disconnect()
}
