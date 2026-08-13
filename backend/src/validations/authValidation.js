import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().max(254).transform((email) => email.trim().toLowerCase()),
  password: z.string().min(8).max(72).regex(/[A-Z]/).regex(/[0-9]/),
})

export const loginSchema = z.object({
  email: z.email().max(254).transform((email) => email.trim().toLowerCase()),
  password: z.string().min(8).max(72),
})

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: z
    .string()
    .trim()
    .max(20)
    .regex(/^[0-9+\-\s()]*$/, 'Số điện thoại không hợp lệ')
    .optional()
    .or(z.literal('')),
  address: z.string().trim().max(255).optional().or(z.literal('')),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: z.string().min(8).max(72).regex(/[A-Z]/).regex(/[0-9]/),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'Mật khẩu mới phải khác mật khẩu hiện tại',
    path: ['newPassword'],
  })
