import assert from 'node:assert/strict'
import test from 'node:test'
import mongoose from 'mongoose'
import { deleteAddress, getAddresses, setDefaultAddress, updateAddress } from '../src/services/addressService.js'
import { memoryStore, USER_A, USER_B } from './helpers/addressMemoryStore.js'

test('PATCH chỉ sửa trường gửi, giữ ID, mặc định và dữ liệu khác', async (t) => {
  const store = memoryStore(t)
  const original = store.seed(USER_A, 2)
  const id = String(original.addresses[0]._id)
  const result = await updateAddress(USER_A, id, { city: 'Thành phố mới', ward: '', label: 'Văn phòng', _id: USER_B, isDefault: false })
  assert.equal(result.items[0].id, id)
  assert.equal(result.items[0].city, 'Thành phố mới')
  assert.equal(result.items[0].phone, original.addresses[0].phone_number)
  assert.equal(result.defaultAddressId, id)
  assert.equal(result.items[0].isDefault, true)
  assert.equal(result.items[1].id, String(original.addresses[1]._id))
  assert.equal(store.calls.saves, 1)
})

test('xóa địa chỉ thường không đổi mặc định hoặc xóa AddressBook', async (t) => {
  const store = memoryStore(t)
  const seeded = store.seed(USER_A, 3)
  const result = await deleteAddress(USER_A, String(seeded.addresses[1]._id))
  assert.equal(result.count, 2)
  assert.equal(result.defaultAddressId, String(seeded.default_address_id))
  assert.equal(store.records.size, 1)
})

for (const sameTime of [false, true]) {
  test(`xóa mặc định chọn theo createdAt${sameTime ? ' bằng nhau thì phân định _id' : ' sớm nhất'}, giữ thứ tự mảng`, async (t) => {
    const store = memoryStore(t)
    const book = store.seed(USER_A, 3)
    book.addresses[1]._id = new mongoose.Types.ObjectId('64b000000000000000000010')
    book.addresses[2]._id = new mongoose.Types.ObjectId('64b000000000000000000009')
    book.addresses[1].createdAt = new Date(sameTime ? '2024-01-01' : '2025-01-01')
    book.addresses[2].createdAt = new Date('2024-01-01')
    store.records.set(String(book._id), book.toObject())
    const result = await deleteAddress(USER_A, String(book.addresses[0]._id))
    assert.equal(result.defaultAddressId, String(book.addresses[2]._id))
    assert.deepEqual(result.items.map((address) => address.id), [String(book.addresses[1]._id), String(book.addresses[2]._id)])
    assert.equal(result.items.filter((address) => address.isDefault).length, 1)
  })
}

test('xóa cuối lưu mảng rỗng/mặc định null trên cùng document', async (t) => {
  const store = memoryStore(t)
  const book = store.seed(USER_A, 1)
  assert.deepEqual(await deleteAddress(USER_A, String(book.addresses[0]._id)), { items: [], defaultAddressId: null, count: 0 })
  assert.equal(store.records.size, 1)
  assert.equal(store.records.get(USER_A).default_address_id, null)
})

test('đặt mặc định không đổi nội dung địa chỉ; đặt lại không save lần nữa', async (t) => {
  const store = memoryStore(t)
  const book = store.seed(USER_A, 2)
  const id = String(book.addresses[1]._id)
  const before = await getAddresses(USER_A)
  const result = await setDefaultAddress(USER_A, id)
  assert.equal(result.defaultAddressId, id)
  for (let index = 0; index < result.items.length; index += 1) {
    const { isDefault: _before, ...previous } = before.items[index]
    const { isDefault: _after, ...next } = result.items[index]
    assert.deepEqual(next, previous)
  }
  assert.deepEqual(await setDefaultAddress(USER_A, id), result)
  assert.equal(store.calls.saves, 1)
})

test('tất cả mutation chỉ tìm địa chỉ trong sổ user hiện tại', async (t) => {
  const store = memoryStore(t)
  const foreign = store.seed(USER_B, 1).addresses[0]._id
  for (const operation of [() => updateAddress(USER_A, String(foreign), { city: 'Mẫu' }), () => deleteAddress(USER_A, String(foreign)), () => setDefaultAddress(USER_A, String(foreign))]) {
    await assert.rejects(operation, (error) => error.statusCode === 404)
  }
  assert.ok(store.calls.queries.every((filter) => filter.user_id === USER_A))
  assert.equal(store.calls.saves, 0)
})

for (const kind of ['update', 'delete', 'default']) {
  test(`${kind} đổi VersionError/duplicate thành 409, không retry`, async (t) => {
    const store = memoryStore(t)
    const book = store.seed(USER_A, 2)
    const id = String(book.addresses[1]._id)
    const operation = () => kind === 'update' ? updateAddress(USER_A, id, { city: 'Mẫu' }) : kind === 'delete' ? deleteAddress(USER_A, id) : setDefaultAddress(USER_A, id)
    for (const failure of [new mongoose.Error.VersionError(book, 0, ['addresses']), Object.assign(new Error('Synthetic duplicate'), { code: 11000 })]) {
      store.calls.failure = failure
      await assert.rejects(operation, (error) => error.statusCode === 409 && !error.message.includes('Synthetic'))
    }
    assert.equal(store.calls.saves, 2)
  })
}

test('PATCH vẫn chạy subdocument validation qua save', async (t) => {
  const store = memoryStore(t)
  const book = store.seed(USER_A, 1)
  await assert.rejects(() => updateAddress(USER_A, String(book.addresses[0]._id), { fullName: '' }), (error) => error.statusCode === 400)
  assert.equal((await getAddresses(USER_A)).items[0].fullName, book.addresses[0].full_name)
})

for (const scenario of ['update-update', 'delete-update', 'default-default', 'delete-default']) {
  test(`mock ${scenario}: một request xung đột, trạng thái lưu còn một mặc định hợp lệ`, async (t) => {
    const store = memoryStore(t)
    const book = store.seed(USER_A, 3)
    const [a, b, c] = book.addresses.map((address) => String(address._id))
    const operations = {
      'update-update': [() => updateAddress(USER_A, a, { city: 'Mẫu mới' }), () => updateAddress(USER_A, a, { label: 'Nhãn mới' })],
      'delete-update': [() => deleteAddress(USER_A, a), () => updateAddress(USER_A, a, { city: 'Mẫu mới' })],
      'default-default': [() => setDefaultAddress(USER_A, b), () => setDefaultAddress(USER_A, c)],
      'delete-default': [() => deleteAddress(USER_A, a), () => setDefaultAddress(USER_A, b)],
    }[scenario]
    const results = await Promise.allSettled(operations.map((operation) => operation()))
    assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1)
    assert.equal(results.find((result) => result.status === 'rejected').reason.statusCode, 409)
    const saved = await getAddresses(USER_A)
    assert.equal(saved.items.filter((address) => address.isDefault).length, 1)
    assert.ok(saved.items.some((address) => address.id === saved.defaultAddressId))
  })
}

test.after(() => assert.equal(mongoose.connection.readyState, 0))
