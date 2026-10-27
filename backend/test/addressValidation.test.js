import assert from 'node:assert/strict'
import test from 'node:test'
import validate from '../src/middlewares/validate.js'
import { addressIdSchema, addressParamsSchema, createAddressSchema, updateAddressSchema } from '../src/validations/addressValidation.js'
import { checkoutSchema } from '../src/validations/checkoutValidation.js'
import { addressSchema as frontendAddressSchema } from '../../frontend/src/components/address-book/addressSchema.js'

const validAddress = {
  fullName: 'Người nhận minh họa',
  phone: '000 000 0001',
  address: 'Số nhà Mẫu-01, đường Minh Họa',
  city: 'Thành phố Minh Họa',
}
const requiredFields = ['fullName', 'phone', 'address', 'city']
const optionalFields = ['ward', 'district', 'postalCode', 'label']
const limits = { fullName: 100, address: 255, city: 100, ward: 100, district: 100, postalCode: 20, label: 30 }

test('POST chuẩn hóa trim và điền trường tùy chọn giống schema frontend', () => {
  const padded = Object.fromEntries(Object.entries(validAddress).map(([name, value]) => [name, `  ${value}  `]))
  const parsed = createAddressSchema.parse(padded)
  assert.deepEqual(parsed, { ...validAddress, ward: '', district: '', postalCode: '', label: '' })
  assert.deepEqual(parsed, frontendAddressSchema.parse(padded))
  assert.equal(parsed.phone, '000 000 0001')
})

test('POST từ chối thiếu trường bắt buộc, rỗng hoặc chỉ có khoảng trắng', () => {
  for (const name of requiredFields) {
    for (const value of [undefined, '', ' \t\n ']) {
      const result = createAddressSchema.safeParse({ ...validAddress, [name]: value })
      assert.equal(result.success, false, name)
      assert.ok(result.error.issues.some((issue) => issue.path[0] === name))
    }
  }
})

test('POST và PATCH kiểm tra độ dài tối thiểu sau trim', () => {
  for (const [name, min] of [['fullName', 2], ['address', 5], ['city', 2]]) {
    for (const [length, expected] of [[min - 1, false], [min, true]]) {
      const value = ` ${'a'.repeat(length)} `
      assert.equal(createAddressSchema.safeParse({ ...validAddress, [name]: value }).success, expected, name)
      assert.equal(updateAddressSchema.safeParse({ [name]: value }).success, expected, name)
    }
  }
})

test('POST, PATCH và frontend thống nhất giới hạn tối đa từng trường', () => {
  for (const [name, max] of Object.entries(limits)) {
    for (const [length, expected] of [[max, true], [max + 1, false]]) {
      const value = ` ${'a'.repeat(length)} `
      const payload = { ...validAddress, [name]: value }
      assert.equal(createAddressSchema.safeParse(payload).success, expected, name)
      assert.equal(frontendAddressSchema.safeParse(payload).success, expected, name)
      assert.equal(updateAddressSchema.safeParse({ [name]: value }).success, expected, name)
    }
  }
})

test('điện thoại dùng cùng định dạng với Checkout và frontend', () => {
  for (const phone of ['00000000', '000 000 0001', '+00 (000) 000-000', '0'.repeat(20), '', ' ', 'abc123456', '000/000/000', '0000000', '0'.repeat(21), '(000) 0000000']) {
    const payload = { ...validAddress, phone }
    const expected = checkoutSchema.safeParse(payload).success
    assert.equal(createAddressSchema.safeParse(payload).success, expected, phone)
    assert.equal(updateAddressSchema.safeParse({ phone }).success, expected, phone)
    assert.equal(frontendAddressSchema.safeParse(payload).success, expected, phone)
  }
})

test('các trường tùy chọn chấp nhận chuỗi rỗng và trim dữ liệu', () => {
  for (const name of optionalFields) {
    assert.equal(createAddressSchema.parse({ ...validAddress, [name]: ' \t ' })[name], '')
    assert.deepEqual(updateAddressSchema.parse({ [name]: ' \t ' }), { [name]: '' })
    assert.equal(createAddressSchema.parse({ ...validAddress, [name]: '  Mẫu  ' })[name], 'Mẫu')
  }
})

test('không ép số, null, array hoặc object thành chuỗi của request', () => {
  for (const name of [...requiredFields, ...optionalFields]) {
    for (const value of [123, null, [], {}]) {
      assert.equal(createAddressSchema.safeParse({ ...validAddress, [name]: value }).success, false, name)
      assert.equal(updateAddressSchema.safeParse({ [name]: value }).success, false, name)
    }
  }
})

test('POST và PATCH từ chối mọi trường ngoài whitelist, gồm ID, chủ sở hữu và mặc định', () => {
  for (const field of ['_id', 'id', 'user_id', 'userId', 'isDefault', 'defaultAddressId', 'default_address_id', '__v', 'addresses', 'full_name', 'createdAt', 'updatedAt', 'unexpected']) {
    assert.equal(createAddressSchema.safeParse({ ...validAddress, [field]: 'forbidden' }).success, false, field)
    assert.equal(updateAddressSchema.safeParse({ label: 'Mẫu', [field]: 'forbidden' }).success, false, field)
  }
})

test('PATCH từ chối payload rỗng hoặc chỉ có undefined', () => {
  for (const payload of [{}, { label: undefined }, null, [], '']) {
    assert.equal(updateAddressSchema.safeParse(payload).success, false)
  }
})

test('PATCH một trường không thêm default hoặc làm rỗng các trường bị bỏ qua', () => {
  assert.deepEqual(updateAddressSchema.parse({ city: '  Thành phố Mẫu  ' }), { city: 'Thành phố Mẫu' })
  assert.deepEqual(updateAddressSchema.parse({ label: '' }), { label: '' })
  for (const [name, value] of Object.entries(validAddress)) {
    assert.deepEqual(updateAddressSchema.parse({ [name]: value }), { [name]: value })
  }
})

test('addressId chỉ nhận chuỗi 24 ký tự hexadecimal, không kiểm tra tồn tại', () => {
  for (const id of ['64b000000000000000000001', 'ABCDEF0123456789ABCDEF01']) {
    assert.equal(addressIdSchema.parse(id), id)
    assert.deepEqual(addressParamsSchema.parse({ addressId: id }), { addressId: id })
  }
  for (const id of ['bad-id', 'a'.repeat(23), 'a'.repeat(25), 'g'.repeat(24), 'abcdefghijkl', ` ${'a'.repeat(24)} `, 123, null, undefined, {}]) {
    assert.equal(addressIdSchema.safeParse(id).success, false)
  }
  assert.equal(addressParamsSchema.safeParse({}).success, false)
  assert.equal(addressParamsSchema.safeParse({ addressId: 'a'.repeat(24), userId: 'other' }).success, false)
})

test('validate middleware hiện có nhận dữ liệu chuẩn hóa và trả lỗi 400 đúng cấu trúc', () => {
  const request = { body: { ...validAddress, fullName: '  Người nhận Mẫu  ' } }
  let error
  validate(createAddressSchema)(request, {}, (nextError) => { error = nextError })
  assert.equal(error, undefined)
  assert.equal(request.body.fullName, 'Người nhận Mẫu')
  assert.equal(request.body.label, '')

  validate(createAddressSchema)({ body: {} }, {}, (nextError) => { error = nextError })
  assert.equal(error.statusCode, 400)
  for (const name of requiredFields) assert.ok(error.details.fieldErrors[name])

  validate(updateAddressSchema)({ body: {} }, {}, (nextError) => { error = nextError })
  assert.equal(error.statusCode, 400)
  assert.ok(error.details.formErrors.length > 0)

  validate(createAddressSchema)({ body: { ...validAddress, user_id: 'other' } }, {}, (nextError) => { error = nextError })
  assert.equal(error.statusCode, 400)
  assert.ok(error.details.formErrors.length > 0)
})
