import { Check, MapPin, Pencil, Phone, Star, Trash2 } from 'lucide-react'
import Button from '../Button.jsx'

export default function AddressCard({ address, onEdit, onDelete, onSetDefault, disabled = false, mutationDisabled = false, defaultBusy = false }) {
  const actionsHintId = `address-actions-${address.id}`
  const locality = [address.ward, address.district, address.city].filter(Boolean).join(', ')
  const actionClass = 'inline-flex min-h-11 items-center justify-center gap-2 border border-neutral-300 px-3 py-2 text-xs font-bold hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-500'

  return (
    <article className={`flex h-full min-w-0 flex-col border bg-white p-5 shadow-sm [overflow-wrap:anywhere] sm:p-6 ${address.isDefault ? 'border-black' : 'border-neutral-200'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <span className="min-w-0 border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-semibold text-neutral-600">
          {address.label || 'Địa chỉ'}
        </span>
        {address.isDefault && (
          <span className="inline-flex items-center gap-1.5 bg-black px-3 py-1.5 text-xs font-bold text-white">
            <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> Mặc định
          </span>
        )}
      </div>

      <h3 className="mt-5 text-lg font-bold text-neutral-950">{address.fullName}</h3>
      <p className="mt-3 flex items-start gap-2 text-sm text-neutral-600">
        <Phone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="min-w-0">{address.phone}</span>
      </p>
      <div className="mt-3 flex items-start gap-2 text-sm leading-6 text-neutral-600">
        <MapPin className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          <p>{address.address}</p>
          <p className="mt-1">{locality}</p>
          {address.postalCode && <p className="mt-1">Mã bưu chính: {address.postalCode}</p>}
        </div>
      </div>

      <div className="mt-auto pt-6">
        <div className="flex flex-wrap gap-2 border-t border-neutral-200 pt-4" aria-describedby={actionsHintId}>
          <Button disabled={disabled || !onEdit} onClick={(event) => onEdit?.(address, event.currentTarget)} aria-label={`Sửa địa chỉ của ${address.fullName}`} className={actionClass}>
            <Pencil className="h-4 w-4 shrink-0" aria-hidden="true" /> Sửa
          </Button>
          <Button disabled={disabled || mutationDisabled || !onDelete} onClick={(event) => onDelete?.(address, event.currentTarget)} aria-label={`Xóa địa chỉ của ${address.fullName}`} className={actionClass}>
            <Trash2 className="h-4 w-4 shrink-0" aria-hidden="true" /> Xóa
          </Button>
          {!address.isDefault && (
            <Button disabled={disabled || mutationDisabled || !onSetDefault} onClick={(event) => onSetDefault?.(address, event.currentTarget)} aria-describedby={actionsHintId} className={actionClass}>
              <Star className="h-4 w-4 shrink-0" aria-hidden="true" /> {defaultBusy ? 'Đang đặt…' : 'Đặt làm mặc định'}
            </Button>
          )}
        </div>
        <p id={actionsHintId} className="mt-3 text-xs leading-5 text-neutral-500">
          Thay đổi được cập nhật sau khi máy chủ xác nhận.
        </p>
      </div>
    </article>
  )
}
