import mongoose from 'mongoose'

export const MAX_ADDRESSES = 20

const addressSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true, required: true },
    full_name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    phone_number: { type: String, required: true, trim: true, match: /^[+0-9][0-9 .()-]{7,19}$/ },
    address_line: { type: String, required: true, trim: true, minlength: 5, maxlength: 255 },
    city: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    ward: { type: String, trim: true, maxlength: 100, default: '' },
    district: { type: String, trim: true, maxlength: 100, default: '' },
    postal_code: { type: String, trim: true, maxlength: 20, default: '' },
    label: { type: String, trim: true, maxlength: 30, default: '' },
  },
  { timestamps: true, strict: 'throw' },
)

const addressBookSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    addresses: {
      type: [addressSchema],
      required: true,
      default: [],
      validate: [
        {
          validator: (addresses) => Array.isArray(addresses) && addresses.length <= MAX_ADDRESSES,
          message: `Mỗi sổ địa chỉ chỉ được có tối đa ${MAX_ADDRESSES} địa chỉ`,
        },
        {
          validator: (addresses) => {
            if (!Array.isArray(addresses)) return false
            const ids = addresses.map((address) => address?._id?.toString())
            return ids.every(Boolean) && new Set(ids).size === ids.length
          },
          message: 'Mỗi địa chỉ phải có một ID riêng, không được trùng hoặc để trống',
        },
      ],
    },
    default_address_id: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  {
    timestamps: true,
    collection: 'address_books',
    strict: 'throw',
    optimisticConcurrency: true,
    autoCreate: false,
    autoIndex: false,
  },
)

addressBookSchema.pre('validate', function validateDefaultAddress() {
  const addresses = this.addresses
  if (!Array.isArray(addresses)) return

  const defaultId = this.default_address_id
  const validDefault = addresses.length === 0
    ? defaultId === null
    : defaultId != null && addresses.some((address) => address?._id?.equals(defaultId))

  if (!validDefault) {
    this.invalidate('default_address_id', 'Danh sách rỗng phải có mặc định null; danh sách có địa chỉ phải chọn mặc định thuộc danh sách')
  }
})

export default mongoose.models.AddressBook || mongoose.model('AddressBook', addressBookSchema)
