import assert from 'node:assert/strict'
import test from 'node:test'
import mongoose from 'mongoose'
import AddressBook from '../src/models/AddressBook.js'
import { createAddress, getAddresses } from '../src/services/addressService.js'
import { memoryStore, payload, USER_A, USER_B } from './helpers/addressMemoryStore.js'

test('GET không có sổ trả rỗng, chỉ query user_id và không save', async (t) => {
  const store = memoryStore(t)
  assert.deepEqual(await getAddresses(USER_A), { items: [], defaultAddressId: null, count: 0 })
  assert.deepEqual(store.calls.queries, [{ user_id: USER_A }])
  assert.equal(store.calls.saves, 0)
  assert.equal(store.records.size, 0)
})

test('GET serialize camelCase, tính isDefault và không lộ chủ sở hữu/version', async (t) => {
  const store = memoryStore(t)
  const book = store.seed(USER_A, 2)
  const result = await getAddresses(USER_A)
  assert.equal(result.count, 2)
  assert.equal(result.defaultAddressId, String(book.addresses[0]._id))
  assert.equal(result.items[0].isDefault, true)
  assert.equal(result.items[1].isDefault, false)
  assert.deepEqual(Object.keys(result.items[0]).sort(), ['id', 'fullName', 'phone', 'address', 'city', 'ward', 'district', 'postalCode', 'label', 'isDefault'].sort())
  assert.equal(store.calls.saves, 0)
})

test('POST đầu tiên save document có _id theo user và chọn mặc định', async (t) => {
  const store = memoryStore(t)
  const result = await createAddress(USER_A, payload)
  assert.equal(result.count, 1)
  assert.equal(result.items[0].fullName, payload.fullName)
  assert.equal(result.items[0].isDefault, true)
  assert.equal(result.defaultAddressId, result.items[0].id)
  assert.equal(store.records.size, 1)
  const saved = store.records.get(USER_A)
  assert.equal(String(saved.user_id), USER_A)
  assert.equal(saved.addresses[0].full_name, payload.fullName)
  assert.equal(saved.addresses[0].postal_code, '')
  assert.equal(AddressBook.schema.options.autoIndex, false)
  assert.equal(AddressBook.schema.options.autoCreate, false)
})

test('POST thứ hai giữ mặc định và ID sổ cũ kể cả ID sổ không trùng user', async (t) => {
  const store = memoryStore(t)
  const oldId = new mongoose.Types.ObjectId()
  const book = store.seed(USER_A, 1, oldId)
  const result = await createAddress(USER_A, { ...payload, label: 'Văn phòng' })
  assert.equal(result.count, 2)
  assert.equal(result.defaultAddressId, String(book.default_address_id))
  assert.equal(result.items[1].isDefault, false)
  assert.equal(result.items[1].label, 'Văn phòng')
  assert.equal(store.records.size, 1)
  assert.ok(store.records.has(String(oldId)))
})

test('sổ rỗng đã tồn tại cũng chọn địa chỉ thêm đầu tiên làm mặc định', async (t) => {
  const store = memoryStore(t)
  store.seed(USER_A, 0)
  const result = await createAddress(USER_A, payload)
  assert.equal(result.defaultAddressId, result.items[0].id)
})

test('A và B đọc/ghi độc lập, service không dùng user_id chèn trong data', async (t) => {
  const store = memoryStore(t)
  await createAddress(USER_A, { ...payload, user_id: USER_B, _id: USER_B, isDefault: false })
  assert.equal((await getAddresses(USER_B)).count, 0)
  await createAddress(USER_B, { ...payload, fullName: 'Người nhận B' })
  assert.equal((await getAddresses(USER_A)).items[0].fullName, payload.fullName)
  assert.equal((await getAddresses(USER_B)).items[0].fullName, 'Người nhận B')
  assert.equal(store.records.size, 2)
})

test('đạt 20 địa chỉ trả 409 trước save', async (t) => {
  const store = memoryStore(t)
  store.seed(USER_A, 20)
  await assert.rejects(() => createAddress(USER_A, payload), (error) => error.statusCode === 409)
  assert.equal(store.calls.saves, 0)
  assert.equal((await getAddresses(USER_A)).count, 20)
})

test('duplicate key được đổi thành 409 và không tự retry POST', async (t) => {
  const store = memoryStore(t)
  store.calls.failure = Object.assign(new Error('Synthetic duplicate'), { code: 11000 })
  await assert.rejects(() => createAddress(USER_A, payload), (error) => error.statusCode === 409 && !error.message.includes('Synthetic'))
  assert.equal(store.calls.saves, 1)
})

test('VersionError được đổi thành 409 và không retry', async (t) => {
  const store = memoryStore(t)
  const book = store.seed(USER_A, 1)
  store.calls.failure = new mongoose.Error.VersionError(book, 0, ['addresses'])
  await assert.rejects(() => createAddress(USER_A, payload), (error) => error.statusCode === 409)
  assert.equal(store.calls.saves, 1)
})

test('lỗi model validation trả 400, lỗi không dự kiến được chuyển cho error handler', async (t) => {
  const store = memoryStore(t)
  await assert.rejects(() => createAddress(USER_A, { ...payload, fullName: '' }), (error) => error.statusCode === 400)
  const failure = new Error('Synthetic storage failure')
  store.calls.failure = failure
  await assert.rejects(() => createAddress(USER_A, payload), (error) => error === failure)
})

for (const count of [0, 1, 19]) {
  test(`hai POST với snapshot ${count} địa chỉ: mock xác minh xử lý lỗi, không chứng minh MongoDB`, async (t) => {
    const store = memoryStore(t)
    if (count) store.seed(USER_A, count)
    const results = await Promise.allSettled([createAddress(USER_A, payload), createAddress(USER_A, { ...payload, label: 'Văn phòng' })])
    assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1)
    const rejected = results.find((result) => result.status === 'rejected')
    assert.equal(rejected.reason.statusCode, 409)
    assert.equal(store.records.size, 1)
    assert.equal((await getAddresses(USER_A)).count, count + 1)
  })
}

test.after(() => assert.equal(mongoose.connection.readyState, 0))
