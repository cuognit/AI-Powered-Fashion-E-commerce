import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useId, useRef } from 'react'
import { useForm } from 'react-hook-form'
import Button from '../Button.jsx'
import Input from '../Input.jsx'
import { addressSchema, EMPTY_ADDRESS_VALUES, getAddressChanges } from './addressSchema.js'
import { addressErrorMessage } from '../../utils/addressErrors.js'

const fields = [
  { name: 'fullName', label: 'Họ và tên người nhận', required: true, autoComplete: 'name' },
  { name: 'phone', label: 'Số điện thoại', required: true, type: 'tel', autoComplete: 'tel' },
  { name: 'address', label: 'Địa chỉ chi tiết', required: true, multiline: true, autoComplete: 'street-address' },
  { name: 'city', label: 'Tỉnh/Thành phố', required: true, autoComplete: 'address-level1' },
  { name: 'ward', label: 'Phường/Xã', autoComplete: 'address-level3' },
  { name: 'district', label: 'Quận/Huyện', autoComplete: 'address-level2' },
  { name: 'postalCode', label: 'Mã bưu chính', autoComplete: 'postal-code' },
  { name: 'label', label: 'Nhãn địa chỉ', autoComplete: 'off', placeholder: 'Nhà riêng, Văn phòng…' },
]

export default function AddressForm({ address = null, onSave, onCancel, submitBlocked = false, blockedMessage = 'Cần tải thành công danh sách trước khi lưu. Nội dung bạn nhập vẫn được giữ lại.' }) {
  const formId = useId()
  const headingRef = useRef(null)
  const active = useRef(false)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: EMPTY_ADDRESS_VALUES,
  })

  useEffect(() => {
    active.current = true
    return () => { active.current = false }
  }, [])

  const submitAddress = async (values) => {
    if (submitBlocked) return
    clearErrors('root.server')
    try {
      const payload = address ? getAddressChanges(values, address) : values
      if (address && Object.keys(payload).length === 0) {
        setError('root.server', { type: 'manual', message: 'Chưa có thay đổi để lưu.' })
        return
      }
      await onSave(payload)
    } catch (error) {
      if (!active.current) return
      const fieldErrors = error.response?.status === 400 ? error.response?.data?.details?.fieldErrors || {} : {}
      for (const name of Object.keys(EMPTY_ADDRESS_VALUES)) {
        if (Array.isArray(fieldErrors[name]) && typeof fieldErrors[name][0] === 'string') setError(name, { type: 'server', message: fieldErrors[name][0] })
      }
      const message = addressErrorMessage(error, { mutation: true })
      setError('root.server', { type: 'server', message })
    }
  }

  useEffect(() => {
    const values = { ...EMPTY_ADDRESS_VALUES }
    for (const name of Object.keys(values)) values[name] = address?.[name] ?? ''
    reset(values)
    headingRef.current?.focus()
  }, [address, reset])

  return (
    <form onSubmit={handleSubmit(submitAddress)} noValidate aria-labelledby={`${formId}-title`} aria-describedby={`${formId}-hint`} className="mt-6 min-w-0 border border-black bg-white p-5 shadow-sm sm:p-8">
      <h2 id={`${formId}-title`} ref={headingRef} tabIndex={-1} className="text-xl font-bold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black">
        {address ? 'Sửa địa chỉ giao hàng' : 'Thêm địa chỉ giao hàng'}
      </h2>
      <p id={`${formId}-hint`} className="mt-2 text-sm leading-6 text-neutral-600">Các trường có dấu * là bắt buộc. Địa chỉ được lưu vào tài khoản khi máy chủ xác nhận thành công; chưa đồng bộ với Checkout.</p>

      <fieldset disabled={isSubmitting} className="mt-6 grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2">
        <legend className="sr-only">Thông tin người nhận và địa chỉ</legend>
        {fields.map((field) => {
          const id = `${formId}-${field.name}`
          const error = errors[field.name]
          const label = (
            <span className="mb-2 block text-xs font-bold text-neutral-700">
              {field.label} {field.required ? <span aria-hidden="true">*</span> : <span className="font-normal text-neutral-500">(tùy chọn)</span>}
            </span>
          )
          const inputProps = {
            ...register(field.name),
            id,
            required: Boolean(field.required),
            autoComplete: field.autoComplete,
            placeholder: field.placeholder,
            'aria-invalid': Boolean(error),
            'aria-describedby': error ? `${id}-error` : undefined,
            className: `w-full min-w-0 border bg-white px-4 py-3 text-sm text-neutral-950 outline-none focus:ring-1 focus:ring-black ${error ? 'border-red-600' : 'border-neutral-300 focus:border-black'}`,
          }

          return (
            <div key={field.name} className={`min-w-0 ${field.multiline ? 'sm:col-span-2' : ''}`}>
              {field.multiline ? (
                <>
                  <label htmlFor={id}>{label}</label>
                  <textarea {...inputProps} rows={3} />
                </>
              ) : (
                <Input label={label} type={field.type || 'text'} {...inputProps} />
              )}
              {error && <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-red-600">{error.message}</p>}
            </div>
          )
        })}
      </fieldset>

      {errors.root?.server && <p role="alert" className="mt-4 text-sm text-red-700">{errors.root.server.message}</p>}
      {submitBlocked && <p role="status" className="mt-4 text-sm text-amber-900">{blockedMessage}</p>}

      <div className="mt-6 flex flex-col gap-3 border-t border-neutral-200 pt-5 sm:flex-row sm:justify-end">
        <Button onClick={onCancel} disabled={isSubmitting} className="min-h-11 border border-neutral-300 px-5 py-3 text-sm font-bold hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-4 disabled:opacity-50">Hủy</Button>
        <Button type="submit" disabled={isSubmitting || submitBlocked} className="min-h-11 bg-black px-5 py-3 text-sm font-bold text-white hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black disabled:cursor-not-allowed disabled:opacity-50">
          {isSubmitting ? 'Đang lưu…' : 'Lưu địa chỉ'}
        </Button>
      </div>
    </form>
  )
}
