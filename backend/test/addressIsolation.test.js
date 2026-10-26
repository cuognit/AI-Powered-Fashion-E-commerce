import assert from 'node:assert/strict'
import test from 'node:test'
import mongoose from 'mongoose'
import User from '../src/models/User.js'
import Order from '../src/models/Order.js'
import Cart from '../src/models/Cart.js'
import * as addresses from '../src/services/addressService.js'
import { getUserProfile } from '../src/services/authService.js'
import { getCart } from '../src/services/cartService.js'
import { memoryStore, payload, USER_A } from './helpers/addressMemoryStore.js'

test('Address Book CRUD không ghi qua Model User/Order/Cart; giữ hợp đồng chuỗi địa chỉ cũ (stub)', async (t) => {
  memoryStore(t)
  const guards = []
  for (const model of [User, Order, Cart]) {
    const rejectWrite = () => { throw new Error('Address Book không được ghi vào model cũ') }
    guards.push(t.mock.method(model.prototype, 'save', rejectWrite))
    for (const method of ['create', 'updateOne', 'findOneAndUpdate', 'deleteOne']) guards.push(t.mock.method(model, method, rejectWrite))
  }
  assert.equal(User.schema.path('address').instance, 'String')
  assert.equal(Order.schema.path('shipping_address').instance, 'String')
  const first = await addresses.createAddress(USER_A, payload)
  const id = first.items[0].id
  const second = await addresses.createAddress(USER_A, { ...payload, label: 'Văn phòng' })
  await addresses.updateAddress(USER_A, id, { city: 'Thành phố mới' })
  await addresses.setDefaultAddress(USER_A, second.items[1].id)
  await addresses.deleteAddress(USER_A, id)
  assert.equal((await addresses.getAddresses(USER_A)).count, 1)
  for (const guard of guards) assert.equal(guard.mock.callCount(), 0)
  assert.equal(mongoose.connection.readyState, 0)
})

test('Profile và GET Cart giữ dữ liệu/interface sau Address Book CRUD (storage stub)', async (t) => {
  memoryStore(t)
  const profile = new User({ _id: USER_A, name: 'Tài khoản Mẫu', email: 'sample@example.test', password: 'not-a-real-password', address: 'Địa chỉ hồ sơ cũ' })
  t.mock.method(User, 'findById', async (id) => {
    assert.equal(id, USER_A)
    return profile
  })
  t.mock.method(Cart, 'findOne', (filter) => {
    assert.deepEqual(filter, { user_id: USER_A })
    return { populate: () => ({ lean: async () => null }) }
  })
  const before = await getUserProfile(USER_A)
  assert.equal(before.user.address, 'Địa chỉ hồ sơ cũ')
  assert.deepEqual(await getCart(USER_A), { items: [] })
  const book = await addresses.createAddress(USER_A, payload)
  await addresses.updateAddress(USER_A, book.items[0].id, { address: 'Địa chỉ sổ mới' })
  assert.deepEqual(await getUserProfile(USER_A), before)
  assert.deepEqual(await getCart(USER_A), { items: [] })
  assert.equal(mongoose.connection.readyState, 0)
})
