import { z } from 'zod'

export const EMPTY_ADDRESS_VALUES = {
  fullName: '',
  phone: '',
  address: '',
  city: '',
  ward: '',
  district: '',
  postalCode: '',
  label: '',
}

export const addressSchema = z.object({
  fullName: z.string().trim().min(2, 'Họ tên cần ít nhất 2 ký tự').max(100, 'Họ tên tối đa 100 ký tự'),
  phone: z.string().trim().min(1, 'Vui lòng nhập số điện thoại').regex(/^[+0-9][0-9 .()-]{7,19}$/, 'Số điện thoại không hợp lệ (8–20 ký tự, gồm số và dấu định dạng)'),
  address: z.string().trim().min(5, 'Địa chỉ cần ít nhất 5 ký tự').max(255, 'Địa chỉ tối đa 255 ký tự'),
  city: z.string().trim().min(2, 'Tỉnh/Thành phố cần ít nhất 2 ký tự').max(100, 'Tỉnh/Thành phố tối đa 100 ký tự'),
  ward: z.string().trim().max(100, 'Phường/Xã tối đa 100 ký tự').optional().default(''),
  district: z.string().trim().max(100, 'Quận/Huyện tối đa 100 ký tự').optional().default(''),
  postalCode: z.string().trim().max(20, 'Mã bưu chính tối đa 20 ký tự').optional().default(''),
  label: z.string().trim().max(30, 'Nhãn địa chỉ tối đa 30 ký tự').optional().default(''),
})

export function getAddressChanges(values, address) {
  const changes = {}
  for (const name of Object.keys(EMPTY_ADDRESS_VALUES)) {
    if (Object.hasOwn(values, name) && values[name] !== String(address[name] ?? '').trim()) changes[name] = values[name]
  }
  return changes
}

export function hasAddressChanged(original, current, { includeDefault = false } = {}) {
  if (!original || !current) return false
  return Object.keys(getAddressChanges(current, original)).length > 0 || (includeDefault && original.isDefault !== current.isDefault)
}
