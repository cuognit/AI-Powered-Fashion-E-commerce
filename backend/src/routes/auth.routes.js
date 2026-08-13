import { Router } from 'express'
import { changePassword, getMe, login, logout, refresh, register, updateProfile } from '../controllers/authController.js'
import { verifyToken } from '../middlewares/verifyToken.js'
import { loginIpRateLimit } from '../middlewares/rateLimit.js'
import validate from '../middlewares/validate.js'
import { changePasswordSchema, loginSchema, registerSchema, updateProfileSchema } from '../validations/authValidation.js'

const router = Router()

router.post('/register', validate(registerSchema), register)
router.post('/login', loginIpRateLimit, validate(loginSchema), login)
router.post('/refresh', refresh)
router.post('/logout', logout)
router.get('/me', verifyToken, getMe)
router.patch('/me', verifyToken, validate(updateProfileSchema), updateProfile)
router.post('/change-password', verifyToken, validate(changePasswordSchema), changePassword)

export default router
