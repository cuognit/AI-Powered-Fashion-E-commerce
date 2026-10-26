import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createFormControl } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { addressSchema, EMPTY_ADDRESS_VALUES, getAddressChanges } from '../src/components/address-book/addressSchema.js'
import { addressErrorMessage } from '../src/utils/addressErrors.js'

const valid = { ...EMPTY_ADDRESS_VALUES, fullName: '  Người nhận Mẫu  ', phone: '000 000 0001', address: 'Số nhà Mẫu-01', city: 'Thành phố Mẫu' }
const createForm = () => {
  const form = createFormControl({ defaultValues: EMPTY_ADDRESS_VALUES, resolver: zodResolver(addressSchema) })
  for (const name of Object.keys(EMPTY_ADDRESS_VALUES)) form.register(name)
  return form
}

test('RHF handleSubmit không gọi callback lưu khi form rỗng hoặc sai định dạng', async () => {
  const form = createForm()
  let saves = 0
  let errors
  await form.handleSubmit(() => { saves += 1 }, (value) => { errors = value })()
  assert.equal(saves, 0)
  assert.ok(errors.fullName && errors.phone && errors.address && errors.city)
  form.reset({ ...valid, phone: 'abc' })
  await form.handleSubmit(() => { saves += 1 }, (value) => { errors = value })()
  assert.equal(saves, 0)
  assert.ok(errors.phone)
})

test('RHF chuyển dữ liệu đã trim cho onSave; callback lỗi không reset nội dung', async () => {
  const form = createForm()
  form.reset(valid)
  let submitted
  await assert.rejects(() => form.handleSubmit(async (values) => { submitted = values; throw new Error('Synthetic API failure') })())
  assert.equal(submitted.fullName, 'Người nhận Mẫu')
  let retried
  await form.handleSubmit((values) => { retried = values })()
  assert.deepEqual(retried, submitted)
})

const formSource = readFileSync(new URL('../src/components/address-book/AddressForm.jsx', import.meta.url), 'utf8')
const submitStart = formSource.indexOf('  const submitAddress = async (values) => {')
const submitCode = formSource.slice(submitStart, formSource.indexOf('\n\n  useEffect(() => {', submitStart))
const compileSubmit = new Function('submitBlocked', 'clearErrors', 'onSave', 'active', 'EMPTY_ADDRESS_VALUES', 'setError', 'address', 'getAddressChanges', 'addressErrorMessage', `${submitCode}; return submitAddress`)
const buildSubmit = (...args) => compileSubmit(...args, addressErrorMessage)
const makeSubmit = (...args) => buildSubmit(...args, null, getAddressChanges)

test('AddressForm ánh xạ lỗi backend vào đúng trường và giữ payload', async () => {
  const errors = {}
  let calls = 0
  const values = { ...valid }
  const submit = makeSubmit(false, () => { }, async () => {
    calls += 1
    throw { response: { status: 400, data: { message: 'Dữ liệu không hợp lệ', details: { fieldErrors: { fullName: ['Lỗi từ backend'], __v: ['Không phải input'] } } } } }
  }, { current: true }, EMPTY_ADDRESS_VALUES, (name, error) => { errors[name] = error })
  await submit(values)
  assert.equal(calls, 1)
  assert.equal(errors.fullName.message, 'Lỗi từ backend')
  assert.ok(errors['root.server'].message.includes('trường được đánh dấu'))
  assert.equal(errors.__v, undefined)
  assert.deepEqual(values, valid)
})

test('AddressForm bị chặn hoặc unmount thì không gửi/không cập nhật lỗi', async () => {
  let calls = 0
  const blocked = makeSubmit(true, () => { }, async () => { calls += 1 }, { current: true }, EMPTY_ADDRESS_VALUES, () => { })
  await blocked(valid)
  assert.equal(calls, 0)
  const inactive = makeSubmit(false, () => { }, async () => { throw new Error('Aborted') }, { current: false }, EMPTY_ADDRESS_VALUES, () => { calls += 1 })
  await inactive(valid)
  assert.equal(calls, 0)
})

const pageSource = readFileSync(new URL('../src/pages/shop/AddressBookPage.jsx', import.meta.url), 'utf8')
const saveStart = pageSource.indexOf('  const saveAddress = async (values) => {')
const saveCode = pageSource.slice(saveStart, pageSource.indexOf('\n\n  return (', saveStart))
const buildSave = new Function('addAddress', 'closeForm', 'setNotice', 'editingAddress', 'editAddress', `${saveCode}; return saveAddress`)
const makeSave = (...args) => buildSave(...args, null, () => { })

test('trang chỉ đóng form/thông báo sau khi backend xác nhận thành công', async () => {
  let finish
  const pending = new Promise((resolve) => { finish = resolve })
  let closed = 0
  let notices = 0
  const save = makeSave(() => pending, () => { closed += 1 }, () => { notices += 1 })
  const result = save(valid)
  assert.equal(closed, 0)
  assert.equal(notices, 0)
  finish(true)
  await result
  assert.equal(closed, 1)
  assert.equal(notices, 1)
})

test('trang không đóng form/báo thành công khi lưu thất bại hoặc phiên đã unmount', async () => {
  let calls = 0
  const failed = makeSave(async () => { throw new Error('Server failure') }, () => { calls += 1 }, () => { calls += 1 })
  await assert.rejects(() => failed(valid))
  const inactive = makeSave(async () => false, () => { calls += 1 }, () => { calls += 1 })
  await inactive(valid)
  assert.equal(calls, 0)
})

test('sửa chỉ gửi trường thực sự thay đổi, gồm xóa giá trị tùy chọn bằng chuỗi rỗng', async () => {
  const original = { ...addressSchema.parse(valid), id: 'address-a', ward: 'Phường cũ', isDefault: true }
  const values = { ...addressSchema.parse(valid), city: 'Thành phố mới', ward: '' }
  assert.deepEqual(getAddressChanges(values, original), { city: 'Thành phố mới', ward: '' })
  let submitted
  const submit = buildSubmit(false, () => { }, async (data) => { submitted = data }, { current: true }, EMPTY_ADDRESS_VALUES, () => { }, original, getAddressChanges)
  await submit(values)
  assert.deepEqual(submitted, { city: 'Thành phố mới', ward: '' })
})

test('sửa không thay đổi dữ liệu không gọi API PATCH rỗng', async () => {
  let calls = 0
  let message
  const original = addressSchema.parse(valid)
  const submit = buildSubmit(false, () => { }, async () => { calls += 1 }, { current: true }, EMPTY_ADDRESS_VALUES, (_name, error) => { message = error.message }, original, getAddressChanges)
  await submit(original)
  assert.equal(calls, 0)
  assert.equal(message, 'Chưa có thay đổi để lưu.')
})

test('sửa gọi editAddress đúng ID, chỉ đóng form khi thành công', async () => {
  let closed = 0
  let updated
  const save = buildSave(() => { throw new Error('Không được gọi POST') }, () => { closed += 1 }, () => { }, { id: 'address-a' }, async (id, data) => { updated = { id, data }; return true })
  await save({ label: 'Nhãn mới' })
  assert.deepEqual(updated, { id: 'address-a', data: { label: 'Nhãn mới' } })
  assert.equal(closed, 1)
})

test('RHF reset A → B → thêm mới thay dữ liệu và xóa lỗi trước đó', async () => {
  const form = createForm()
  const received = []
  form.reset({ ...valid, fullName: 'Người nhận A' })
  await form.handleSubmit((data) => received.push(data))()
  form.reset({ ...valid, fullName: 'Người nhận B' })
  await form.handleSubmit((data) => received.push(data))()
  form.reset(EMPTY_ADDRESS_VALUES)
  let invalid
  await form.handleSubmit((data) => received.push(data), (errors) => { invalid = errors })()
  assert.deepEqual(received.map((data) => data.fullName), ['Người nhận A', 'Người nhận B'])
  assert.ok(invalid.fullName)
})

const cancelStart = pageSource.indexOf('  const cancelDelete = () => {')
const cancelCode = pageSource.slice(cancelStart, pageSource.indexOf('\n\n  const confirmDelete', cancelStart))
const makeCancelDelete = new Function('setDeleteTarget', 'setDeleteError', 'restoreFocus', `${cancelCode}; return cancelDelete`)
const deleteStart = pageSource.indexOf('  const confirmDelete = async () => {')
const deleteCode = pageSource.slice(deleteStart, pageSource.indexOf('\n\n  const chooseDefault', deleteStart))
const compileConfirmDelete = new Function('deleteTarget', 'saving', 'listBlocked', 'deleteMissing', 'setDeleteError', 'removeAddress', 'setDeleteTarget', 'setNotice', 'restoreFocus', 'active', 'deleteChanged', 'addressErrorMessage', `${deleteCode}; return confirmDelete`)
const makeConfirmDelete = (...args) => compileConfirmDelete(...args, false, addressErrorMessage)

test('Hủy xóa chỉ đóng xác nhận và trả focus, không gọi API', () => {
  const calls = []
  makeCancelDelete((value) => calls.push(['target', value]), (value) => calls.push(['error', value]), () => calls.push(['focus']))()
  assert.deepEqual(calls, [['target', null], ['error', ''], ['focus']])
})

test('xác nhận xóa chỉ cập nhật UI sau khi DELETE thành công', async () => {
  let finish
  const pending = new Promise((resolve) => { finish = resolve })
  const changes = []
  const confirm = makeConfirmDelete({ id: 'target' }, false, false, false, () => { }, (id) => { assert.equal(id, 'target'); return pending }, (value) => changes.push(value), (value) => changes.push(value), () => { }, { current: true })
  const result = confirm()
  assert.deepEqual(changes, [])
  finish(true)
  await result
  assert.equal(changes[0], null)
  assert.equal(changes.length, 2)
})

test('DELETE lỗi giữ xác nhận, không báo thành công; busy/địa chỉ mất không gửi tiếp', async () => {
  let errors = 0
  let calls = 0
  const fail = makeConfirmDelete({ id: 'target' }, false, false, false, () => { errors += 1 }, async () => { throw new Error('Failed') }, () => { calls += 1 }, () => { calls += 1 }, () => { }, { current: true })
  await fail()
  assert.equal(calls, 0)
  assert.equal(errors, 2)
  for (const [busy, blocked, missing] of [[true, false, false], [false, true, false], [false, false, true]]) {
    const confirm = makeConfirmDelete({ id: 'target' }, busy, blocked, missing, () => { }, async () => { calls += 1 }, () => { }, () => { }, () => { }, { current: true })
    await confirm()
  }
  assert.equal(calls, 0)
})

test('lỗi không phải validation không được gắn fieldErrors lên input', async () => {
  const errors = {}
  const submit = makeSubmit(false, () => { }, async () => {
    throw { response: { status: 500, data: { message: 'MongoServerError private stack', details: { fieldErrors: { fullName: ['Internal stack'] } } } } }
  }, { current: true }, EMPTY_ADDRESS_VALUES, (name, value) => { errors[name] = value })
  await submit(valid)
  assert.equal(errors.fullName, undefined)
  assert.ok(!errors['root.server'].message.includes('MongoServerError'))
})

test('fieldErrors sai cấu trúc không làm crash form', async () => {
  const errors = {}
  const submit = makeSubmit(false, () => { }, async () => {
    throw { response: { status: 400, data: { details: { fieldErrors: { fullName: { message: 'bad shape' }, phone: ['Thông báo đúng cấu trúc'] } } } } }
  }, { current: true }, EMPTY_ADDRESS_VALUES, (name, value) => { errors[name] = value })
  await submit(valid)
  assert.equal(errors.fullName, undefined)
  assert.equal(errors.phone.message, 'Thông báo đúng cấu trúc')
})

test('xác nhận xóa cũ bị khóa nếu nội dung đã đổi sau GET lại', async () => {
  let deletes = 0
  const confirm = compileConfirmDelete({ id: 'same-id' }, false, false, false, () => { }, async () => { deletes += 1 }, () => { }, () => { }, () => { }, { current: true }, true, addressErrorMessage)
  await confirm()
  assert.equal(deletes, 0)
})
