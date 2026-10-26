import mongoose from 'mongoose'
import AddressBook, { MAX_ADDRESSES } from '../models/AddressBook.js'
import { AppError } from '../utils/AppError.js'

function serializeAddressBook(book) {
  if (!book) return { items: [], defaultAddressId: null, count: 0 }
  const defaultAddressId = book.default_address_id ? String(book.default_address_id) : null
  const items = book.addresses.map((address) => ({
    id: String(address._id),
    fullName: address.full_name,
    phone: address.phone_number,
    address: address.address_line,
    city: address.city,
    ward: address.ward || '',
    district: address.district || '',
    postalCode: address.postal_code || '',
    label: address.label || '',
    isDefault: String(address._id) === defaultAddressId,
  }))
  return { items, defaultAddressId, count: items.length }
}

export async function getAddresses(userId) {
  const book = await AddressBook.findOne({ user_id: userId })
  return serializeAddressBook(book)
}

export async function createAddress(userId, data) {
  try {
    let book = await AddressBook.findOne({ user_id: userId })
    if (!book) {
      book = new AddressBook({ _id: userId, user_id: userId })
    }
    if (book.addresses.length >= MAX_ADDRESSES) {
      throw new AppError(`Bạn chỉ được lưu tối đa ${MAX_ADDRESSES} địa chỉ`, 409)
    }

    const firstAddress = book.addresses.length === 0
    book.addresses.push({
      full_name: data.fullName,
      phone_number: data.phone,
      address_line: data.address,
      city: data.city,
      ward: data.ward,
      district: data.district,
      postal_code: data.postalCode,
      label: data.label,
    })
    if (firstAddress) book.default_address_id = book.addresses[0]._id

    await book.save()
    return serializeAddressBook(book)
  } catch (error) {
    if (error?.code === 11000 || error instanceof mongoose.Error.VersionError) {
      throw new AppError('Sổ địa chỉ vừa thay đổi. Vui lòng tải lại danh sách, kiểm tra địa chỉ đã lưu trước khi gửi lại.', 409)
    }
    if (error instanceof mongoose.Error.ValidationError) {
      throw new AppError('Dữ liệu địa chỉ không hợp lệ', 400)
    }
    throw error
  }
}

async function findOwnedAddress(userId, addressId) {
  const book = await AddressBook.findOne({ user_id: userId })
  const address = book?.addresses.id(addressId)
  if (!address) throw new AppError('Không tìm thấy địa chỉ trong sổ của bạn', 404)
  return { book, address }
}

function rethrowMutationError(error) {
  if (error?.code === 11000 || error instanceof mongoose.Error.VersionError) {
    throw new AppError('Sổ địa chỉ vừa thay đổi. Vui lòng tải lại danh sách và kiểm tra trước khi thực hiện lại.', 409)
  }
  if (error instanceof mongoose.Error.ValidationError) {
    throw new AppError('Dữ liệu địa chỉ không hợp lệ', 400)
  }
  throw error
}

export async function updateAddress(userId, addressId, data) {
  try {
    const { book, address } = await findOwnedAddress(userId, addressId)
    const fieldMap = {
      fullName: 'full_name', phone: 'phone_number', address: 'address_line', city: 'city',
      ward: 'ward', district: 'district', postalCode: 'postal_code', label: 'label',
    }
    for (const [apiField, modelField] of Object.entries(fieldMap)) {
      if (Object.hasOwn(data, apiField) && data[apiField] !== undefined) address[modelField] = data[apiField]
    }
    await book.save()
    return serializeAddressBook(book)
  } catch (error) {
    rethrowMutationError(error)
  }
}

export async function deleteAddress(userId, addressId) {
  try {
    const { book, address } = await findOwnedAddress(userId, addressId)
    const wasDefault = book.default_address_id?.equals(address._id)
    book.addresses.pull(address._id)
    if (book.addresses.length === 0) book.default_address_id = null
    else if (wasDefault) {
      const oldest = [...book.addresses].sort((a, b) => (
        ((a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0)) || String(a._id).localeCompare(String(b._id))
      ))[0]
      book.default_address_id = oldest._id
    }
    await book.save()
    return serializeAddressBook(book)
  } catch (error) {
    rethrowMutationError(error)
  }
}

export async function setDefaultAddress(userId, addressId) {
  try {
    const { book, address } = await findOwnedAddress(userId, addressId)
    if (!book.default_address_id?.equals(address._id)) {
      book.default_address_id = address._id
      await book.save()
    }
    return serializeAddressBook(book)
  } catch (error) {
    rethrowMutationError(error)
  }
}
