import mongoose from 'mongoose'
import AddressBook from '../../src/models/AddressBook.js'

export const USER_A = '64b000000000000000000001'
export const USER_B = '64b000000000000000000002'
export const payload = { fullName: 'Người nhận Mẫu', phone: '000 000 0001', address: 'Số nhà Mẫu-01', city: 'Thành phố Mẫu', ward: '', district: '', postalCode: '', label: 'Nhà riêng' }

export function memoryStore(t) {
  const records = new Map()
  const calls = { queries: [], saves: 0, failure: null }
  t.mock.method(AddressBook, 'findOne', async (filter) => {
    calls.queries.push(filter)
    const record = [...records.values()].find((book) => String(book.user_id) === String(filter.user_id))
    return record ? AddressBook.hydrate(record) : null
  })
  t.mock.method(AddressBook.prototype, 'save', async function () {
    calls.saves += 1
    await this.validate()
    if (calls.failure) throw calls.failure
    const previous = records.get(String(this._id))
    if (this.isNew && previous) throw Object.assign(new Error('Synthetic duplicate key'), { code: 11000 })
    if (!this.isNew && previous?.__v !== this.__v) throw new mongoose.Error.VersionError(this, this.__v, ['addresses'])
    this.__v = previous ? previous.__v + 1 : 0
    this.isNew = false
    records.set(String(this._id), this.toObject())
    return this
  })

  const seed = (userId, count, id = userId) => {
    const book = new AddressBook({
      _id: id,
      user_id: userId,
      __v: 0,
      addresses: Array.from({ length: count }, (_, index) => ({ full_name: `Người nhận Mẫu ${index}`, phone_number: payload.phone, address_line: payload.address, city: payload.city })),
    })
    if (count) book.default_address_id = book.addresses[0]._id
    records.set(String(book._id), book.toObject())
    return book
  }
  return { records, calls, seed }
}
