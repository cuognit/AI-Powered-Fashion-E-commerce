import { Router } from 'express'
import { createAddress, deleteAddress, getAddresses, setDefaultAddress, updateAddress } from '../controllers/addressController.js'
import { verifyToken } from '../middlewares/verifyToken.js'
import validate from '../middlewares/validate.js'
import { addressParamsSchema, createAddressSchema, setDefaultAddressSchema, updateAddressSchema } from '../validations/addressValidation.js'

const router = Router()
router.use(verifyToken)
router.param('addressId', (request, _response, next) => {
  const result = addressParamsSchema.safeParse(request.params)
  if (!result.success) {
    return next(Object.assign(new Error('Mã địa chỉ không hợp lệ'), { statusCode: 400, details: result.error.flatten() }))
  }
  next()
})
router.get('/', getAddresses)
router.post('/', validate(createAddressSchema), createAddress)
router.patch('/:addressId/default', validate(setDefaultAddressSchema), setDefaultAddress)
router.patch('/:addressId', validate(updateAddressSchema), updateAddress)
router.delete('/:addressId', deleteAddress)

export default router
