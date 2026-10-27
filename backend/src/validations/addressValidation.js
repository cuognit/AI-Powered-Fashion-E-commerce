import { z } from 'zod'

const addressFields = {
  fullName: z.string().trim().min(2, 'Họ tên cần ít nhất 2 ký tự').max(100, 'Họ tên tối đa 100 ký tự'),
  phone: z.string().trim().min(1, 'Vui lòng nhập số điện thoại').regex(/^[+0-9][0-9 .()-]{7,19}$/, 'Số điện thoại không hợp lệ (8–20 ký tự, gồm số và dấu định dạng)'),
  address: z.string().trim().min(5, 'Địa chỉ cần ít nhất 5 ký tự').max(255, 'Địa chỉ tối đa 255 ký tự'),
  city: z.string().trim().min(2, 'Tỉnh/Thành phố cần ít nhất 2 ký tự').max(100, 'Tỉnh/Thành phố tối đa 100 ký tự'),
  ward: z.string().trim().max(100, 'Phường/Xã tối đa 100 ký tự'),
  district: z.string().trim().max(100, 'Quận/Huyện tối đa 100 ký tự'),
  postalCode: z.string().trim().max(20, 'Mã bưu chính tối đa 20 ký tự'),
  label: z.string().trim().max(30, 'Nhãn địa chỉ tối đa 30 ký tự'),
}

export const createAddressSchema = z.strictObject({
  ...addressFields,
  ward: addressFields.ward.optional().default(''),
  district: addressFields.district.optional().default(''),
  postalCode: addressFields.postalCode.optional().default(''),
  label: addressFields.label.optional().default(''),
})

export const updateAddressSchema = z.strictObject(addressFields)
  .partial()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Cần ít nhất một trường địa chỉ để cập nhật',
  })

export const addressIdSchema = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Mã địa chỉ phải gồm đúng 24 ký tự hexadecimal')
export const addressParamsSchema = z.strictObject({ addressId: addressIdSchema })

export const setDefaultAddressSchema = z.strictObject({}).default({})
