import { Router } from 'express'
import { login, logout, refresh, register } from '../controllers/authController.js'
import validate from '../middlewares/validate.js'
import { loginSchema, registerSchema } from '../validations/authValidation.js'

const router = Router()

router.post('/register', validate(registerSchema), register)
router.post('/login', validate(loginSchema), login)
router.post('/refresh', refresh)
router.post('/logout', logout)

export default router
