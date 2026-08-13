import { z } from 'zod'

export const checkoutSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  phone: z.string().trim().regex(/^[+0-9][0-9 .()-]{7,19}$/),
  address: z.string().trim().min(5).max(255),
  city: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().max(20).optional().default(''),
  notes: z.string().trim().max(500).optional().default(''),
  coupon: z.string().trim().toUpperCase().max(30).optional().nullable(),
  bankCode: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{2,20}$/).optional(),
})
