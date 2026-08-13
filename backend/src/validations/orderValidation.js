import { z } from 'zod'
import { CUSTOMER_CANCEL_REASONS } from '../utils/order.js'

export const cancelOrderSchema = z.object({
  reasonCode: z.enum(CUSTOMER_CANCEL_REASONS),
  note: z.string().trim().max(500).optional().default(''),
})

export const updateOrderStatusSchema = z.object({
  status: z.enum(['processing', 'shipped', 'completed', 'canceled']),
  note: z.string().trim().max(500).optional().default(''),
  carrier: z.string().trim().max(100).optional(),
  trackingCode: z.string().trim().max(100).optional(),
  estimatedDeliveryAt: z.string().datetime({ offset: true }).optional().nullable(),
}).superRefine((data, context) => {
  if (data.status !== 'shipped') return
  if (!data.carrier) context.addIssue({ code: 'custom', path: ['carrier'], message: 'Vui lòng nhập đơn vị vận chuyển' })
  if (!data.trackingCode) context.addIssue({ code: 'custom', path: ['trackingCode'], message: 'Vui lòng nhập mã vận đơn' })
})

export const completeRefundSchema = z.object({
  status: z.literal('completed'),
  reference: z.string().trim().max(100).optional().default(''),
  note: z.string().trim().max(500).optional().default(''),
})
