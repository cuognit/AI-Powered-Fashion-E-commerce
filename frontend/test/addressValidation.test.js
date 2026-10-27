import assert from 'node:assert/strict'
import test from 'node:test'
import { zodResolver } from '@hookform/resolvers/zod'
import { addressSchema } from '../src/components/address-book/addressSchema.js'

const validAddress = {
  fullName: 'Người nhận minh họa',
  phone: '000 000 0001',
  address: 'Số nhà Mẫu-01, đường Minh Họa',
  city: 'Thành phố Minh Họa',
}
const requiredFields = ['fullName', 'phone', 'address', 'city']

test('dữ liệu hợp lệ được trim; trường tùy chọn bị bỏ qua trở thành chuỗi rỗng', () => {
  const padded = Object.fromEntries(Object.entries(validAddress).map(([name, value]) => [name, `  ${value}  `]))
  const parsed = addressSchema.parse(padded)
  assert.deepEqual(parsed, { ...validAddress, ward: '', district: '', postalCode: '', label: '' })
  assert.equal(parsed.phone, '000 000 0001')
})

test('trường bắt buộc không được thiếu, rỗng hoặc chỉ có khoảng trắng', () => {
  for (const name of requiredFields) {
    for (const value of [undefined, '', ' \t\n ']) {
      const result = addressSchema.safeParse({ ...validAddress, [name]: value })
      assert.equal(result.success, false, `${name}: ${String(value)}`)
      assert.ok(result.error.issues.some((issue) => issue.path[0] === name))
    }
  }
})

test('giới hạn tối thiểu được kiểm tra sau trim', () => {
  for (const [name, min] of [['fullName', 2], ['address', 5], ['city', 2]]) {
    assert.equal(addressSchema.safeParse({ ...validAddress, [name]: ` ${'a'.repeat(min - 1)} ` }).success, false)
    assert.equal(addressSchema.safeParse({ ...validAddress, [name]: ` ${'a'.repeat(min)} ` }).success, true)
  }
})

test('chấp nhận đúng giới hạn tối đa và từ chối quá một ký tự ở mọi trường có giới hạn', () => {
  const limits = { fullName: 100, address: 255, city: 100, ward: 100, district: 100, postalCode: 20, label: 30 }
  for (const [name, max] of Object.entries(limits)) {
    assert.equal(addressSchema.safeParse({ ...validAddress, [name]: ` ${'a'.repeat(max)} ` }).success, true, name)
    assert.equal(addressSchema.safeParse({ ...validAddress, [name]: 'a'.repeat(max + 1) }).success, false, name)
  }
})

test('định dạng điện thoại tương thích Checkout: giữ số 0, dấu + và dấu phân cách', () => {
  for (const phone of ['00000000', '000 000 0001', '+00 (000) 000-000', '0'.repeat(20)]) {
    assert.equal(addressSchema.safeParse({ ...validAddress, phone }).success, true, phone)
  }
  for (const phone of ['abc123456', '000/000/000', '0000000', '0'.repeat(21), '(000) 0000000']) {
    assert.equal(addressSchema.safeParse({ ...validAddress, phone }).success, false, phone)
  }
})

test('trường tùy chọn chấp nhận rỗng và chuẩn hóa khoảng trắng', () => {
  const optional = { ward: '  Phường Mẫu  ', district: '  Quận Mẫu  ', postalCode: '  MAU  ', label: '  Văn phòng  ' }
  const parsed = addressSchema.parse({ ...validAddress, ...optional })
  for (const [name, value] of Object.entries(optional)) assert.equal(parsed[name], value.trim())
  for (const name of Object.keys(optional)) {
    assert.equal(addressSchema.parse({ ...validAddress, [name]: '' })[name], '')
    assert.equal(addressSchema.parse({ ...validAddress, [name]: ' \t ' })[name], '')
  }
})

test('không ép số, null hoặc object thành chuỗi của input', () => {
  for (const name of [...requiredFields, 'ward', 'district', 'postalCode', 'label']) {
    for (const value of [123, null, {}]) {
      assert.equal(addressSchema.safeParse({ ...validAddress, [name]: value }).success, false, name)
    }
  }
})

test('dữ liệu submit chỉ có các trường địa chỉ, không mang id hoặc quyền sở hữu/mặc định', () => {
  const parsed = addressSchema.parse({ ...validAddress, id: 'sample-id', userId: 'other-user', isDefault: true, defaultAddressId: 'other-address' })
  assert.deepEqual(Object.keys(parsed).sort(), ['fullName', 'phone', 'address', 'city', 'ward', 'district', 'postalCode', 'label'].sort())
})

test('zodResolver trả lỗi đúng tên trường và không có values khi dữ liệu không hợp lệ', async () => {
  const resolver = zodResolver(addressSchema)
  const result = await resolver({ fullName: ' ', phone: 'abc', address: ' ', city: ' ' }, {}, { criteriaMode: 'firstError', fields: {}, shouldUseNativeValidation: false })
  assert.deepEqual(result.values, {})
  assert.deepEqual(Object.keys(result.errors).sort(), [...requiredFields].sort())
  for (const name of requiredFields) assert.equal(typeof result.errors[name].message, 'string')
})

test('zodResolver chuyển dữ liệu đã chuẩn hóa cho callback submit', async () => {
  const resolver = zodResolver(addressSchema)
  const result = await resolver({ ...validAddress, fullName: '  Người nhận minh họa  ', label: '  Nhà riêng  ' }, {}, { criteriaMode: 'firstError', fields: {}, shouldUseNativeValidation: false })
  assert.deepEqual(result.errors, {})
  assert.equal(result.values.fullName, validAddress.fullName)
  assert.equal(result.values.label, 'Nhà riêng')
})
