import assert from 'node:assert/strict'
import test from 'node:test'
import mongoose from 'mongoose'
import AddressBook, { MAX_ADDRESSES } from '../src/models/AddressBook.js'

const objectId = () => new mongoose.Types.ObjectId()
const sampleAddress = (overrides = {}) => ({
  full_name: 'Người nhận minh họa',
  phone_number: '000 000 0001',
  address_line: 'Số nhà Mẫu-01, đường Minh Họa',
  city: 'Thành phố Minh Họa',
  ...overrides,
})

function bookWith(addresses = [sampleAddress()]) {
  const book = new AddressBook({ user_id: objectId(), addresses })
  if (book.addresses?.[0]?._id) book.default_address_id = book.addresses[0]._id
  return book
}

async function rejectsPath(book, path) {
  await assert.rejects(() => book.validate(), (error) => {
    assert.ok(error instanceof mongoose.Error.ValidationError)
    assert.ok(error.errors[path], `Thiếu lỗi tại ${path}; nhận ${Object.keys(error.errors).join(', ')}`)
    return true
  })
}

test('model khai báo collection, ref, index unique, timestamps và optimistic concurrency', () => {
  assert.equal(AddressBook.collection.name, 'address_books')
  assert.equal(AddressBook.schema.path('user_id').options.ref, 'User')
  assert.ok(AddressBook.schema.indexes().some(([keys, options]) => keys.user_id === 1 && options.unique === true))
  assert.equal(AddressBook.schema.options.timestamps, true)
  assert.equal(AddressBook.schema.options.optimisticConcurrency, true)
  assert.equal(AddressBook.schema.options.versionKey, '__v')
  assert.equal(AddressBook.schema.options.strict, 'throw')
  const subSchema = AddressBook.schema.path('addresses').schema
  assert.equal(subSchema.options.timestamps, true)
  assert.equal(subSchema.options.strict, 'throw')
  assert.ok(subSchema.path('createdAt'))
  assert.ok(subSchema.path('updatedAt'))
  assert.equal(AddressBook.schema.path('default_address_id').options.ref, undefined)
})

test('danh sách rỗng có default [] và mặc định null, validate không cần MongoDB', async () => {
  const book = new AddressBook({ user_id: objectId() })
  await book.validate()
  assert.deepEqual(book.addresses.toObject(), [])
  assert.equal(book.default_address_id, null)
  assert.equal(mongoose.connection.readyState, 0)
})

test('user_id bắt buộc và phải cast được sang ObjectId', async () => {
  for (const user_id of [undefined, null, 'bad-id', '']) {
    await rejectsPath(new AddressBook({ user_id }), 'user_id')
  }
})

test('subdocument có ObjectId riêng, trim dữ liệu và default chuỗi rỗng', async () => {
  const book = bookWith([sampleAddress({ full_name: '  Người nhận Mẫu  ', phone_number: '  000 000 0001  ', address_line: '  Số nhà Mẫu  ', city: '  Thành phố Mẫu  ', ward: '  Phường Mẫu  ' }), sampleAddress()])
  await book.validate()
  const address = book.addresses[0]
  assert.ok(address._id instanceof mongoose.Types.ObjectId)
  assert.notEqual(String(address._id), String(book.addresses[1]._id))
  assert.equal(address.full_name, 'Người nhận Mẫu')
  assert.equal(address.phone_number, '000 000 0001')
  assert.equal(address.address_line, 'Số nhà Mẫu')
  assert.equal(address.city, 'Thành phố Mẫu')
  assert.equal(address.ward, 'Phường Mẫu')
  for (const name of ['district', 'postal_code', 'label']) assert.equal(address[name], '')
  assert.ok(book.default_address_id.equals(address._id))
})

test('validate document cha kiểm tra trường bắt buộc trong subdocument', async () => {
  for (const name of ['full_name', 'phone_number', 'address_line', 'city']) {
    for (const value of [undefined, '', ' \t ']) {
      await rejectsPath(bookWith([sampleAddress({ [name]: value })]), `addresses.0.${name}`)
    }
  }
})

test('subdocument kiểm tra minlength sau trim', async () => {
  for (const [name, min] of [['full_name', 2], ['address_line', 5], ['city', 2]]) {
    await rejectsPath(bookWith([sampleAddress({ [name]: ` ${'a'.repeat(min - 1)} ` })]), `addresses.0.${name}`)
    await bookWith([sampleAddress({ [name]: ` ${'a'.repeat(min)} ` })]).validate()
  }
})

test('subdocument kiểm tra maxlength ở mọi trường', async () => {
  const limits = { full_name: 100, address_line: 255, city: 100, ward: 100, district: 100, postal_code: 20, label: 30 }
  for (const [name, max] of Object.entries(limits)) {
    await bookWith([sampleAddress({ [name]: ` ${'a'.repeat(max)} ` })]).validate()
    await rejectsPath(bookWith([sampleAddress({ [name]: 'a'.repeat(max + 1) })]), `addresses.0.${name}`)
  }
})

test('subdocument chấp nhận trường tùy chọn rỗng và từ chối sai định dạng điện thoại', async () => {
  await bookWith([sampleAddress({ ward: ' ', district: '', postal_code: '', label: '' })]).validate()
  for (const phone_number of ['abc123456', '0000000', '0'.repeat(21), '000/000/000']) {
    await rejectsPath(bookWith([sampleAddress({ phone_number })]), 'addresses.0.phone_number')
  }
})

test('chấp nhận đúng 20 địa chỉ và từ chối mảng vượt giới hạn', async () => {
  assert.equal(MAX_ADDRESSES, 20)
  await bookWith(Array.from({ length: 20 }, () => sampleAddress())).validate()
  await rejectsPath(bookWith(Array.from({ length: 21 }, () => sampleAddress())), 'addresses')
  await rejectsPath(bookWith(null), 'addresses')
})

test('từ chối ID trùng, ID trống hoặc phần tử null trong mảng', async () => {
  const duplicateId = objectId()
  await rejectsPath(bookWith([sampleAddress({ _id: duplicateId }), sampleAddress({ _id: duplicateId })]), 'addresses')
  await rejectsPath(bookWith([sampleAddress({ _id: null })]), 'addresses')
  await rejectsPath(bookWith([sampleAddress(), null]), 'addresses')
})

test('mặc định phải thuộc danh sách, kể cả khi ObjectId đúng định dạng', async () => {
  const book = bookWith()
  book.default_address_id = objectId()
  await rejectsPath(book, 'default_address_id')
})

test('danh sách có địa chỉ không được có mặc định null hoặc undefined', async () => {
  for (const value of [null, undefined]) {
    const book = bookWith()
    book.default_address_id = value
    await rejectsPath(book, 'default_address_id')
  }
})

test('danh sách rỗng từ chối mặc định khác null, kể cả unset', async () => {
  for (const value of [objectId(), undefined]) {
    const book = bookWith([])
    book.default_address_id = value
    await rejectsPath(book, 'default_address_id')
  }
})

test('model không tự chọn mặc định đầu tiên thay Service', async () => {
  const book = new AddressBook({ user_id: objectId(), addresses: [sampleAddress()] })
  assert.equal(book.default_address_id, null)
  await rejectsPath(book, 'default_address_id')
})

test('thay đổi danh sách khiến mặc định bị treo sẽ bị từ chối, không tự chọn địa chỉ khác', async () => {
  const book = bookWith([sampleAddress(), sampleAddress()])
  const previousDefault = book.default_address_id
  book.addresses.pull(previousDefault)
  await rejectsPath(book, 'default_address_id')
  assert.ok(book.default_address_id.equals(previousDefault))
  book.default_address_id = book.addresses[0]._id
  await book.validate()

  book.addresses = []
  await rejectsPath(book, 'default_address_id')
  book.default_address_id = null
  await book.validate()
})

test('strict throw ngăn trường không khai báo ở document và subdocument', async () => {
  assert.throws(() => new AddressBook({ user_id: objectId(), isDefault: true }), mongoose.Error.StrictModeError)
  const book = bookWith()
  assert.throws(() => book.set('unexpected', 'value'), mongoose.Error.StrictModeError)
  assert.throws(() => book.addresses[0].set('isDefault', true), mongoose.Error.StrictModeError)
  await rejectsPath(bookWith([sampleAddress({ unexpected: 'value' })]), 'addresses')
})

test('các document không dùng chung mảng addresses mặc định', () => {
  const first = new AddressBook({ user_id: objectId() })
  const second = new AddressBook({ user_id: objectId() })
  first.addresses.push(sampleAddress())
  assert.equal(second.addresses.length, 0)
})

test.after(() => {
  assert.equal(mongoose.connection.readyState, 0, 'Các kiểm thử này phải chạy khi chưa kết nối MongoDB')
})
