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
